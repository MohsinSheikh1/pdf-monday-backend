function generateHTML(
  boardName,
  columns,
  groups,
  groupwise_items,
  groupwise_item_column_values,
  statusColumns
) {
  const boardHtml = `<h1>${boardName}</h1>`;

  const columnsHtml = columns.map(({ title }) => `<th>${title}</th>`);
  const subitemsColumnsHtml = columns.map(({ title, type }) => {
    if (type === "subtasks") return "";
    else return `<th>${title}</th>`;
  });

  const groupsHtml = groups.map((groupName) => {
    return `<h2>${groupName}</h2>`;
  });

  const itemsHtml = groupwise_items.map((group) => {
    return group.map(({ name, columnValues, subitems }) => {
      return `<td>${name}</td>${columnValues
        .map(({ text, type, id }) => {
          if (type === "color") {
            const statusColumn = statusColumns.find(
              (statusColumn) => statusColumn.id === id
            );

            const labelIndex = statusColumn.labels.indexOf(text);
            const labelColorBackground =
              statusColumn.labelColors[labelIndex]?.color || "#797E93";
            const labelColorBorder =
              statusColumn.labelColors[labelIndex]?.border || "#797E93";

            return `<td style="background-color: ${labelColorBackground}; border: 1px solid ${labelColorBorder};">${text}</td>`;
          }
          return `<td>${text}</td>`;
        })
        .join("")}${
        subitems.subitemsName.length > 0
          ? `<tr><th>Subitems</th>${subitemsColumnsHtml.join(
              ""
            )}</tr>${subitems.subitemsName
              .map((name, i) => {
                return `<tr><td></td><td>${name}</td>${subitems.subitemsColumnValues[
                  i
                ]
                  .map(({ text, type, id }) => {
                    if (type === "color") {
                      const statusColumn = statusColumns.find(
                        (statusColumn) => statusColumn.id === id
                      );

                      const labelIndex = statusColumn.labels.indexOf(text);
                      const labelColorBackground =
                        statusColumn.labelColors[labelIndex]?.color ||
                        "#797E93";
                      const labelColorBorder =
                        statusColumn.labelColors[labelIndex]?.border ||
                        "#797E93";

                      return `<td style="background-color: ${labelColorBackground}; border: 1px solid ${labelColorBorder};">${text}</td>`;
                    }
                    return `<td>${text}</td>`;
                  })
                  .join("")}</tr>`;
              })
              .join("")}`
          : ""
      }`;
    });
  });
  // console.dir(itemsHtml, { depth: null });

  // console.dir(boardHtml, { depth: null });
  // console.dir(groupsHtml, { depth: null });
  // console.dir(columnsHtml, { depth: null });
  // console.dir(itemsHtml, { depth: null });
  // console.dir(columnValuesHtml, { depth: null });
  // console.dir(itemsHtml, { depth: null });

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
            h, td {
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
            ${boardHtml}
            ${groupsHtml
              .map((group, i) => {
                return `${group}
                <table>
                  <tr>
                    ${columnsHtml.join("")}
                  </tr>
                  ${itemsHtml[i]
                    .map((item) => {
                      return `<tr>${item}</tr>`;
                    })
                    .join("")}
                </table>`;
              })
              .join("")}
          </body>
        </html>
      `;
  return html;
}

module.exports = { generateHTML };
