// Определяем размеры шкалы
const width = 800;
const height = 200;
const margin = { top: 20, right: 20, bottom: 50, left: 40 };

// Контейнер tooltip
const tooltip = d3.select("#tooltip");

// Функция загрузки данных и построения шкалы
async function drawTimeline() {
  // Загружаем JSON с данными
  const data = await d3.json("data.json");

  const periods = data.periods;
  const sages = data.sages;

  // Определяем диапазон лет (минимальный и максимальный год)
  const minYear = d3.min(periods, d => d.start);
  const maxYear = d3.max(periods, d => d.end);

  // Создаём шкалу X (годы -> пиксели)
  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([margin.left, width - margin.right]);

  // Создаём SVG контейнер
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Добавляем ось X (года)
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d")));

  // Отображаем периоды (прямоугольники)
  svg.selectAll(".period")
    .data(periods)
    .enter()
    .append("rect")
    .attr("class", "period")
    .attr("x", d => xScale(d.start))
    .attr("y", height / 2 - 20)
    .attr("width", d => xScale(d.end) - xScale(d.start))
    .attr("height", 30)
    .attr("fill", "#b3cde0")
    .on("mouseover", (event, d) => showTooltip(event, `${d.name}: ${d.start} — ${d.end}`))
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);

  // Отображаем мудрецов (точки)
  svg.selectAll(".sage")
    .data(sages)
    .enter()
    .append("circle")
    .attr("class", "sage")
    .attr("cx", d => xScale(d.year))
    .attr("cy", height / 2 - 5)
    .attr("r", 6)
    .attr("fill", "#fbb4ae")
    .on("mouseover", (event, d) => showTooltip(event, `<strong>${d.name}</strong><br>${d.bio}`))
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);
}

// Функции для tooltip (всплывающих подсказок)
function showTooltip(event, text) {
  tooltip.style("opacity", 1).html(text);
  moveTooltip(event);
}

function moveTooltip(event) {
  tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

// Запускаем
drawTimeline();
