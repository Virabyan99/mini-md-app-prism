export function extractTableData(tableNode: any): { headers: string[], alignments: (string | null)[], rows: string[][] } {
    const headerRow = tableNode.children[0];
    const headers = headerRow.children.map((cell: any) => cell.children[0]?.value || '');
    const separatorRow = tableNode.children[1];
    const alignments = separatorRow.children.map((cell: any) => {
      const text = cell.children[0]?.value.trim() || '';
      if (text.startsWith(':') && text.endsWith(':')) return 'center';
      if (text.startsWith(':')) return 'left';
      if (text.endsWith(':')) return 'right';
      return null;
    });
    const rows = tableNode.children.slice(2).map((row: any) =>
      row.children.map((cell: any) => cell.children[0]?.value || '')
    );
    return { headers, alignments, rows };
  }