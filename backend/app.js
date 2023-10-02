const express = require("express");
const puppeteer = require("puppeteer");
const schedule = require("node-schedule");
const monday = require("monday-sdk-js")();
const nodemailer = require("nodemailer");

monday.setToken(
  "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI4MTk4Mjg4NywiYWFpIjoxMSwidWlkIjo0ODU5NTMzMiwiaWFkIjoiMjAyMy0wOS0xNFQyMTo0MDo0MS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTg3MTUzNzYsInJnbiI6ImV1YzEifQ.pmVheIJ_ordb6DX7Zzj3_5ztoe7tWM3dMax0nmo-DTM"
);
const app = express();

app.use(express.json());

async function getRequiredData(context, includeSubitems, includeUpdates) {
  let data = JSON.stringify(
    await monday.api(
      `query {
                boards (ids: [${context.boardId}]) {
                    name
                    columns {
                      type
                        title
                        id
                        settings_str
                      }
                    groups (ids: ["${context.groupId}"]) {
                        title
                        items {
                            id
                            name
                            column_values 
                            {
                                value
                                type
                                id
                                text
                            }
                        }
                    }
                }
            }`
    )
  );

  data = JSON.parse(data);
  data = data.data;

  return data;
}

function getStatusColumnsData(columns) {
  const statusColumns = [];
  columns.forEach((column) => {
    if (column.type === "color") {
      const settings_str = JSON.parse(column.settings_str);
      const labels = Object.values(settings_str.labels);
      const labelColors = Object.values(settings_str.labels_colors);
      const statusColumn = {
        id: column.id,
        labels,
        labelColors
      };
      statusColumns.push(statusColumn);
    }
  });
  return statusColumns;
}

function columnValuesToHTML(columnValues, statusColumns) {
  return columnValues
    .map((columnValues) => {
      if (columnValues.type === "color") {
        const statusColumn = statusColumns.find(
          (statusColumn) => statusColumn.id === columnValues.id
        );

        const labelIndex = statusColumn.labels.indexOf(columnValues.text);
        const labelColorBackground = statusColumn.labelColors[labelIndex].color;
        const labelColorBorder = statusColumn.labelColors[labelIndex].border;

        return `<td style="background-color: ${labelColorBackground}; border: 1px solid ${labelColorBorder};">${columnValues.text}</td>`;
      }
      return `<td>${columnValues.text}</td>`;
    })
    .join("");
}

function itemsToHTML(items, statusColumns) {
  return items
    .map((item) => {
      return `
            <tr>
                <td>${item.name}</td>
                ${columnValuesToHTML(item.column_values, statusColumns)}
            </tr>
            `;
    })
    .join("");
}

function columnsToHTML(columns) {
  return columns
    .map((column) => {
      return `<th>${column.title}</th>`;
    })
    .join("");
}

function groupsToHTML(groups, columns, statusColumns) {
  return groups
    .map((group) => {
      return `
        <h2>${group.title}</h2>
        <table>
            <tr>
                ${columnsToHTML(columns)}
            </tr>
            ${itemsToHTML(group.items, statusColumns)}
    `;
    })
    .join("");
}

function generateHTML(boards) {
  const html = `
        <html>
          <head>
            <style>
                h1, h2 {
                    text-align: center;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid black;
                    text-align: center;
                }
                th {
                    background-color: #f2f2f2;
                    /*                    padding: .5rem;*/
                    font-weight: bold;
                    color: black;
                }

            </style>
          </head>
          <body>
            ${boards
              .map((board, i) => {
                const statusColumns = getStatusColumnsData(board.columns);
                return `<h1>${board.name}</h1>
                    ${groupsToHTML(
                      board.groups,
                      board.columns,
                      statusColumns
                    )}`;
              })
              .join("")}
          </body>
        </html>
    `;
  return html;
}

async function generatePDF(html) {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.setContent(html);

  await page.emulateMediaType("screen");

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();

  return pdf;
}

app.post("/api/pdf", async (req, res) => {
  const includeSubitems = Boolean(req.query.includeSubitems);
  const includeUpdates = Boolean(req.query.includeUpdates);

  const data = await getRequiredData(req.body, includeSubitems, includeUpdates);
  const html = generateHTML(data.boards);
  const pdf = await generatePDF(html);
  res.contentType("application/pdf");
  res.send(pdf);
});

app.post("/api/pdf/schedule", async (req, res) => {
  const time = req.body.time;
  const job = schedule.scheduleJob(time, async () => {
    const data = await getRequiredData(req.body.context);
    const html = generateHTML(data);
    const pdf = await generatePDF(html);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: "sheikhmohsin181@gmail.com",
        pass: "ebmj lpyz ocbb wbwk"
      }
    });

    const mailOptions = {
      from: "",
      to: "faiqueahmadkhan@gmail.com",
      subject: "PDF",
      text: "PDF",
      attachments: [
        {
          filename: "PDF.pdf",
          content: pdf,
          contentType: "application/pdf"
        }
      ]
    };

    await transporter.sendMail(mailOptions);
  });

  res.send("Job scheduled");
  job.on("scheduled", () => {
    console.log(`Scheduling for ${time}`);
  });
});

module.exports = app;
