AFRAME.registerComponent("create-buttons", {
  init: function() {
    // 1. Crear botón
    var button1 = document.createElement("button");
    button1.innerHTML = "CALIFICAR";
    button1.setAttribute("id", "rating-button");
    button1.setAttribute("class", "btn btn-warning");

    // 2. Crear botón
    var button2 = document.createElement("button");
    button2.innerHTML = "ORDENAR";
    button2.setAttribute("id", "order-button");
    button2.setAttribute("class", "btn btn-warning");

    // 3. Crear el botón de resumen y cuenta total
    var button3 = document.createElement("button");
    button3.innerHTML = "RESUMEN DEL PEDIDO";
    button3.setAttribute("id", "order-summary-button");
    button3.setAttribute("class", "btn btn-warning ml-3");

    // Añadir elementos de botón
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.appendChild(button1);
    buttonDiv.appendChild(button2);
  }
});


