$(document).ready(function () {
  $.ajax({
    url: "hotels-bookings-data",
    method: "get",
    success: (response) => {
      labels = response.map((hotels) => hotels.name);
      data = response.map((hotels) => {
        return hotels.bookings;
      });
      data = [].concat(...data);
      console.log(data);
      data = data.map((details) => details.totalRooms);
      const ctx = document.getElementById("myChart").getContext("2d");
      const myChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "no of rooms",
              data: data,
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
            },
          },
        },
      });
    },
  });
  let ctx = document.getElementById('piechart').getContext("2d");
  let piechart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        'Red',
        'Blue',
        'Yellow'
      ],
      datasets: [{
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ],
        hoverOffset: 4
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
        },
      },
    },
  });
});
      
      