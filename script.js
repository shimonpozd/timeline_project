// script.js - World History Timeline

const width = 1800; // Расширяем ширину для длинной шкалы времени
const height = 600;
const margin = { top: 80, right: 60, bottom: 80, left: 180 };

const baseColors = {
  zugot: "#b3cde0",
  tanaim_temple: "#ccebc5",
  tanaim_post_temple: "#fddaec",
  amoraim_eretz_israel: "#decbe4",
  amoraim_bavel: "#fed9a6",
  savoraim: "#ffffcc"
};

fetch("data.json")
  .then(r => r.json())
  .then(data => {
    const periods = data.periods;
    const sages = data.sages;

    // Сортируем периоды по времени
    const sortedPeriods = periods.slice().sort((a, b) => a.start - b.start);
    const periodIds = sortedPeriods.map(p => p.id);

    // Шкала времени (X)
    const xScale = d3.scaleLinear()
      .domain([d3.min(periods, d => d.start), d3.max(periods, d => d.end)])
      .range([margin.left, width - margin.right]);

    // Категории (Y)
    const categories = ["Зугот", "Танаим (до храма)", "Танаим (после храма)", "Амораим (Эрец-Исраэль)", "Амораим (Бавель)", "Савораим"];
    const yScale = d3.scaleBand()
      .domain(categories)
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const svg = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height);

    // Рисуем периоды
    svg.selectAll(".period")
      .data(sortedPeriods)
      .enter()
      .append("rect")
      .attr("class", "period")
      .attr("x", d => xScale(d.start))
      .attr("y", margin.top)
      .attr("width", d => xScale(d.end) - xScale(d.start))
      .attr("height", height - margin.bottom - margin.top)
      .attr("fill", d => baseColors[d.id] || "#ccc")
      .attr("opacity", 0.4);

    // Подписываем периоды
    svg.selectAll(".periodLabel")
      .data(sortedPeriods)
      .enter()
      .append("text")
      .attr("class", "periodLabel")
      .attr("x", d => (xScale(d.start) + xScale(d.end)) / 2)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .text(d => d.name);

    // Рисуем мудрецов
    svg.selectAll(".sage")
      .data(sages)
      .enter()
      .append("text")
      .attr("class", "sage")
      .attr("x", d => xScale(d.periodStart))
      .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 11)
      .attr("fill", "black")
      .text(d => d.name);

    // Ось X (время)
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d + " г."));

    // Ось Y (категории)
    svg.append("g")
      .attr("transform", `translate(${margin.left - 10}, 0)`)
      .call(d3.axisLeft(yScale));
  })
  .catch(err => console.error(err));
