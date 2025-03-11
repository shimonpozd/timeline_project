// script.js

// Размеры графика
const width = 1200;
const height = 800;
const margin = { top: 50, right: 50, bottom: 50, left: 100 };

// Цвета для категорий (базовые цвета для периодов)
const baseColors = {
  zugot: "#b3cde0",
  tanaim_temple: "#ccebc5",
  tanaim_post_temple: "#fddaec",
  amoraim_eretz_israel: "#decbe4",
  amoraim_bavel: "#fed9a6",
  savoraim: "#ffffcc"
};

// Функция для генерации оттенков для поколений
function tintColor(baseColor, tintFactor) {
  return d3.color(baseColor).brighter(tintFactor).toString();
}

// Загружаем данные
fetch("data.json")
  .then(response => response.json())
  .then(data => {
    console.log("Данные загружены:", data);

    const periods = data.periods;
    const sages = data.sages;

    // Группируем мудрецов по периодам и поколениям
    const groupedSages = d3.group(sages, d => d.periodId, d => d.groupId);

    // Получаем все периоды и поколения
    const periodKeys = Array.from(groupedSages.keys());
    const generations = Array.from(new Set(sages.map(d => d.groupId))).sort();

    // Создаём шкалу X (по поколениям)
    const xScale = d3.scaleBand()
      .domain(generations)
      .range([margin.left, width - margin.right])
      .padding(0.3);

    // Создаём шкалу Y (по периодам)
    const yScale = d3.scaleBand()
      .domain(periodKeys)
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    // Создаём основной SVG
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Рисуем фоновые прямоугольники для периодов
    svg.selectAll(".period-rect")
      .data(periodKeys)
      .enter()
      .append("rect")
      .attr("x", margin.left)
      .attr("y", d => yScale(d))
      .attr("width", width - margin.right - margin.left)
      .attr("height", yScale.bandwidth())
      .attr("fill", d => baseColors[d] || "#ccc")
      .attr("opacity", 0.4);

    // Добавляем подписи для периодов (по оси Y)
    svg.selectAll(".period-label")
      .data(periodKeys)
      .enter()
      .append("text")
      .attr("x", margin.left - 10)
      .attr("y", d => yScale(d) + yScale.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "bold")
      .text(d => periods.find(p => p.id === d)?.name || d);

    // Добавляем подписи для поколений (по оси X)
    svg.selectAll(".generation-label")
      .data(generations)
      .enter()
      .append("text")
      .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
      .attr("y", height - margin.bottom + 20)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .text(d => d);

    // Добавляем имена мудрецов
    sages.forEach(sage => {
      const colorTint = tintColor(baseColors[sage.periodId] || "#ccc", 1.5);
      svg.append("text")
        .attr("x", xScale(sage.groupId) + xScale.bandwidth() / 2)
        .attr("y", yScale(sage.periodId) + yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("fill", colorTint)
        .text(sage.name);
    });
  })
  .catch(error => console.error("Ошибка загрузки данных:", error));
