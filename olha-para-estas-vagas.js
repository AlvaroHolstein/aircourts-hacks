const axios = require("axios");

const ax = axios.create({
  baseURL: "https://www.aircourts.com/index.php/v2/api/search",
});

/**
 * Este objeto tem as keys com o nome correto dos parametros necessários
 * para introduzir no URL final para procurar campos para um determinado dia
 * para uma certa hora.
 */
const requiredParams = {
  sport: 1, // Futebol de 5
  city: 12, // Cidade do Porto (código do Aircourts)
  date: null, // Data do dia que vou querer marcar o jogo
  start_time: "19:00", // Esta vai ser a hora default que vou procurar
  time_override: 1, // não sei ao certo para que serve este campo
  page: 1, // Só vai ser preciso uma página porque vou pedir resultados que chegue no campo abaixo para encher uma página
  page_size: 99, // O comentário acima está cheio de razão
  favorites: 0, // não tenho favoritos nem estou logado (em principio 😁)
};

/**
 * Reminder - Se o numero for menor que 10 mais vale meter lhe um zero atrás.
 * @param {string} day
 * @param {string} month
 * @param {string} hour
 * @param {string} year
 * @param {string} minute
 * @param {string} seconds
 * @returns
 */
function getDate(
  day = "02",
  month = "June" /** Tem que ser o nome em Inglês */,
  hour = "19",
  year = "2022",
  minute = "00" /** Vai chegar para ter os resultados que quero penso eu de que */,
  seconds = "00" /*  Nem importa*/
) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
  let options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };

  let fullDate = `${month} ${day}, ${year} ${hour}:${minute}:${seconds}`;
  let hoursForAircouts = `${hour}:${minute}`;

  let date = new Date(fullDate);
  let dateInCorrectTimeZone = date.toLocaleDateString("pt-EG", options);
  let dateForAircourts = `${year}-${date.getMonth() + 1}-${day}`;
  // console.log({ fullDate, dateInCorrectTimeZone, hoursForAircouts, dateForAircourts});
  return {
    fullDate,
    dateInCorrectTimeZone,
    hoursForAircouts,
    dateForAircourts,
  };
}

(async function () {
  try {
    // Construir url
    let time = getDate("02");
    console.log(`\n\t Para a Data -> ${time.dateInCorrectTimeZone}\n`)
    let url = Object.keys(requiredParams)
      .map((el) /*Keys/Paramentes*/ => {
        switch (el) {
          case "date":
            requiredParams[el] = time.dateForAircourts;
            break;
          case "start_time":
            requiredParams[el] = time.hoursForAircouts;
            break;
          // The rest of the values should be correct using the default Value.
        }
        return `${el}=${requiredParams[el]}`;
      })
      .join("&");

    // console.log(url);
    let todosOsCampos = await ax.get(`?${url}`);
    console.log("Recebi o resultado de ", todosOsCampos.data.total);
    todosOsCampos = todosOsCampos.data.results;

    let totalDeVagas = 0;
    todosOsCampos.forEach((campo, i) => {
      slots = campo.slots;

      let temVagas = [];
      if (slots.length > 0) {
        temVagas = slots.filter((vaga, index) => {
          if (index < 3) {
            if (vaga.locked) return false;
            else {
              if (vaga.start.endsWith(":30") || vaga.end.endsWith(":30")) {
                // console.log("❌❌❌❌ Não quero saber", `Nome do Campo: ${campo.slug}`, `Court Id: ${vaga.court_id}`, `Horário ${vaga.start} - ${vaga.end}`, "❌❌❌❌")
               //  return true;
              }
              console.log("\t",
                // `Nome do Campo: ${campo.slug}`,
                `Horário ${vaga.start} - ${vaga.end}`,
                `Court Id: ${vaga.court_id}`,
              );

              return true;
            }
          } else {
            return false;
          }
        });
        if (temVagas.length > 0) {
          console.log(
            `✅✅✅ Campo Vago ${campo.slug} \n __________________\n `,
            `\nHá ${temVagas.length} vagas aqui\n`,
            campo.address,
            `\nMaterial \n\t--> ${campo.available_material ? campo.available_material : "Aparentemente não disponiblizam nada!!!"}`,
            `\nPode se pagar com \n\t--> ${campo.payment_methods ? campo.payment_methods : "Sei lá eu!!!"}`,"\n __________________\n\n\n"
          );
          totalDeVagas += temVagas.length;
        }
      }
    });
    console.log(
      `Há ${totalDeVagas} vagas ${
        totalDeVagas > 5 ? "🥳🥳 Bota Caralho 🥳🥳" : "Fodeu 😟", "\n"
      }`
    );
  } catch (madafackingErro) {
    console.log("El erro!", madafackingErro);
  }
})();
