// Match content-panel heights within each visual row, including after font loading.
const exampleGrid = document.querySelector('.try-grid');
if (exampleGrid) {
  const panels = [...exampleGrid.querySelectorAll('.try-card-overlay')];
  const alignExamplePanels = () => {
    panels.forEach(panel => { panel.style.minHeight = ''; });
    const rows = new Map();
    panels.forEach(panel => {
      const top = panel.parentElement.offsetTop;
      if (!rows.has(top)) rows.set(top, []);
      rows.get(top).push(panel);
    });
    rows.forEach(row => {
      const height = Math.max(...row.map(panel => panel.getBoundingClientRect().height));
      row.forEach(panel => { panel.style.minHeight = height + 'px'; });
    });
  };
  new ResizeObserver(alignExamplePanels).observe(exampleGrid);
  document.fonts.ready.then(alignExamplePanels);
}
