// Допустим, мы сначала загружаем data.json (плоский список),
// а затем формируем иерархию вручную.

const width = 1000;
const height = 600;
const margin = 10;

fetch("data.json")
  .then(response => response.json())
  .then(rawData => {
    // Собираем periods и sages
    const periods = rawData.periods;
    const sages = rawData.sages;

    // Построим дерево: root -> [period -> [group -> [sages...]]]

    // Сначала группируем: (periodId) -> (groupId) -> [sages]
    const grouped = {};
    sages.forEach(s => {
      const p = s.periodId;
      const g = s.groupId;
      if (!grouped[p]) grouped[p] = {};
      if (!grouped[p][g]) grouped[p][g] = [];
      grouped[p][g].push(s);
    });

    // Собираем массив children для root
    const rootChildren = [];
    periods.forEach(period => {
      const periodId = period.id;
      const periodName = period.name;
      const groupMap = grouped[periodId] || {};
      // Второй уровень: groupId
      const groupChildren = [];
      Object.keys(groupMap).forEach(gid => {
        const sagesArr = groupMap[gid];
        // Третий уровень: sages
        const sageNodes = sagesArr.map(s => ({
          name: s.name,
          value: 1 // один мудрец = 1
        }));
        groupChildren.push({
          name: gid,
          children: sageNodes
        });
      });

      // Если нет groupChildren (вдруг?), пропускаем
      if (groupChildren.length > 0) {
        rootChildren.push({
          name: periodName,
          children: groupChildren
        });
      }
    });

    // Формируем общий объект для d3.hierarchy
    const rootData = {
      name: "root",
      children: rootChildren
    };

    // Используем d3.hierarchy + treemap
    const root = d3.hierarchy(rootData)
      .sum(d => d.value || 0) // суммируем по value
      .sort((a, b) => b.value - a.value); // можно сортировать по величине

    const treemapLayout = d3.treemap()
      .size([width, height])
      .padding(2);

    treemapLayout(root);

    // root теперь содержит x0,y0,x1,y1 для каждого узла

    // Создаём SVG
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin * 2)
      .attr("height", height + margin * 2)
      .append("g")
      .attr("transform", `translate(${margin}, ${margin})`);

    // Цветовая шкала (по глубине)
    // Или можно делать по имени периода.
    const color = d3.scaleOrdinal(d3.schemeSet3);

    // Узлы
    const nodes = svg.selectAll("g.node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x0}, ${d.y0})`);

    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.depth)) // глубина 0 - root, 1 - period, 2 - group, 3 - sage
      .attr("stroke", "#fff");

    nodes.append("text")
      .attr("dx", 4)
      .attr("dy", 14)
      .text(d => {
        // Показываем имя только если влезает
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        const text = d.data.name || "";
        // Можно проверить, влезет ли хотя бы 50px по высоте.
        if (w > 50 && h > 20) {
          return text;
        }
        return "";
      });
  })
  .catch(err => console.error(err));
