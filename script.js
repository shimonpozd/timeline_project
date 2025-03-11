// script.js
// Делается 1D-таймлайн: ось X = год, от minYear до maxYear.
// Периоды рисуем как прямоугольные полосы снизу, а наверху — ось.
// Мудрецы – точки/кружки над полосами. Legend — слева сверху.

const width = 1600;
const height = 600;
const margin = { top: 50, right: 40, bottom: 80, left: 60 };

// Цвета для периодов
const periodColors = {
  zugot: "#b3cde0",
  tanaim_temple: "#ccebc5",
  tanaim_post_temple: "#fddaec",
  amoraim_eretz_israel: "#decbe4",
  amoraim_bavel: "#fed9a6",
  savoraim: "#ffffcc"
};

function getColor(periodId) {
  return periodColors[periodId] || "#ccc";
}

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    const periods = data.periods;
    const sages = data.sages;

    // Определим общий диапазон лет
    const minYear = d3.min([
      d3.min(periods, d => d.start),
      d3.min(sages, s => s.year)
    ]);
    const maxYear = d3.max([
      d3.max(periods, d => d.end),
      d3.max(sages, s => s.year)
    ]);

    // Создаём шкалу X: год -> пиксели
    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([margin.left, width - margin.right]);

    // Создаём основной SVG
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // === Ось X (внизу) ===
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(20)
          .tickFormat(d3.format("d")) // чтобы годы были целые
      );

    // === Подпись оси ===
    svg.append("text")
      .attr("x", (width / 2))
      .attr("y", height - 30)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .text("Годы (до н.э. отрицательные, н.э. положительные)");

    // === Периоды (прямоугольники) ===
    // Нарисуем их внизу, чуть выше оси, например, на высоте rectY
    // Высота полосы = 30 пикселей
    const rectHeight = 30;
    const rectY = height - margin.bottom - rectHeight - 10;

    svg.selectAll(".periodRect")
      .data(periods)
      .enter()
      .append("rect")
      .attr("class", "periodRect")
      .attr("x", d => xScale(d.start))
      .attr("y", rectY)
      .attr("width", d => xScale(d.end) - xScale(d.start))
      .attr("height", rectHeight)
      .attr("fill", d => getColor(d.id))
      .attr("opacity", 0.6);

    // Подпись названий периодов (над прямоугольниками)
    svg.selectAll(".periodLabel")
      .data(periods)
      .enter()
      .append("text")
      .attr("class", "periodLabel")
      .attr("x", d => (xScale(d.start) + xScale(d.end)) / 2)
      .attr("y", rectY - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(d => d.name);

    // === Мудрецы (точки) ===
    // Пусть они будут выше периодов, например, на y = (rectY - 60),
    // чтобы они располагались чуть выше. Если хотите «лесенку», можно варьировать y.
    // Также можно случайно «разбросать» их по вертикали, чтобы не перекрывались.
    // Здесь — одна линия, y = rectY - 60.
    const sagesY = rectY - 60;

    svg.selectAll(".sageCircle")
      .data(sages)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.year))
      .attr("cy", sagesY)
      .attr("r", 5)
      .attr("fill", d => getColor(d.periodId))
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // Подписи имён мудрецов, чуть выше точки
    svg.selectAll(".sageLabel")
      .data(sages)
      .enter()
      .append("text")
      .attr("x", d => xScale(d.year))
      .attr("y", sagesY - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .text(d => d.name);

    // === Легенда для периодов ===
    // Справа сверху (или слева — по вкусу)
    const legendData = periods.map(p => p.id)
      .filter((v, i, a) => a.indexOf(v) === i); // уникальные id
    // Упорядочим также по start
    const sorted = periods.slice().sort((a, b) => a.start - b.start);
    const uniqueIds = Array.from(new Set(sorted.map(d => d.id)));

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right - 120}, ${margin.top})`);

    legend.selectAll(".legendItem")
      .data(uniqueIds)
      .enter()
      .append("g")
      .attr("class", "legendItem")
      .attr("transform", (d, i) => `translate(0, ${i*20})`)
      .each(function(d) {
        const g = d3.select(this);
        // прямоугольник
        g.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", getColor(d));
        // подпись
        const per = periods.find(p => p.id === d);
        g.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .attr("font-size", 12)
          .text(per ? per.name : d);
      });

    // === Заголовок ===
    svg.append("text")
      .attr("x", width/2)
      .attr("y", margin.top/2)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .attr("font-weight", "bold")
      .text("World-style Timeline: Еврейские периоды и мудрецы");
  })
  .catch(err => console.error(err));
