import { DecoratorNode } from 'lexical';
import { JSX } from 'react';

export class TableNode extends DecoratorNode<JSX.Element> {
  __tableData: { headers: string[], alignments: (string | null)[], rows: string[][] };

  static getType() {
    return 'table';
  }

  static clone(node: TableNode) {
    return new TableNode(node.__tableData, node.__key);
  }

  static importJSON(json: any) {
    return new TableNode(json.tableData);
  }

  constructor(tableData: { headers: string[], alignments: (string | null)[], rows: string[][] }, key?: string) {
    super(key);
    this.__tableData = tableData;
  }

  createDOM() {
    const div = document.createElement('div');
    div.className = 'table-container';
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    const { headers, alignments, rows } = this.__tableData;
    return (
      <div className="table-container">
        <table className="table border-collapse border border-gray-400 w-full my-4">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="border border-gray-300 px-4 py-2 bg-gray-100"
                  style={{ textAlign: alignments[i] || 'left' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="border border-gray-300 px-4 py-2"
                    style={{ textAlign: alignments[j] || 'left' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  exportJSON() {
    return {
      type: 'table',
      tableData: this.__tableData,
      version: 1,
    };
  }
}