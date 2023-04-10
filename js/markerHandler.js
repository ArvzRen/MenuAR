var tableNumber = null;

AFRAME.registerComponent("markerhandler", {
    init: async function () {

        //Obtener el número de mesa
        if (tableNumber === null) {
            this.askTableNumber();
        }

        //Toma la colección de platillos desde la base de datos Firebase.
        var dishes = await this.getDishes();

        //Evento markerFound.
        this.el.addEventListener("markerFound", () => {
            if (tableNumber !== null) {
                var markerId = this.el.id;
                this.handleMarkerFound(dishes, markerId);
            }
        });

        //Evento markerLost.
        this.el.addEventListener("markerLost", () => {
            this.handleMarkerLost();
        });

    },
    askTableNumber: function () {
        var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
        swal({
            title: "¡Bienvenido a 'El Antojo'!",
            icon: iconUrl,
            content: {
                element: "input",
                attributes: {
                    placeholder: "Escribe el número de tu mesa",
                    type: "number",
                    min: 1
                }
            },
            closeOnClickOutside: false,
        }).then(inputValue => {
            tableNumber = inputValue;
        });
    },
    handleMarkerFound: function (dishes, markerId) {
        // Obtener el día
        var todaysDate = new Date();
        var todaysDay = todaysDate.getDay();

        // De domingo a sábado: 0 - 6
        var days = [
            "Domingo",
            "Lunes",
            "Martes",
            "Miércoles",
            "Jueves",
            "Viernes",
            "Sábado"
        ];

        //Obtener el platillo según su ID 
        var dish = dishes.filter(dish => dish.id === markerId)[0];

        //Verificar si el platillo está disponible en hoy
        if (dish.unavailable_days.includes(days[todaysDay])) {
            swal({
                icon: "warning",
                title: dish.dish_name.toUpperCase(),
                text: "¡Este platillo no está disponible hoy!",
                timer: 2500,
                buttons: false
            });
        } else {
            //Cambiar el tamaño del modelo a su escala inicial
            var model = document.querySelector(`#model-${dish.id}`);
            model.setAttribute("position", dish.model_geometry.position);
            model.setAttribute("rotation", dish.model_geometry.rotation);
            model.setAttribute("scale", dish.model_geometry.scale);

            //Actualizar el contenido UI de VISIBILIDAD de la escena AR (MODELO, INGREDIENTES Y PRECIO)      
            model.setAttribute("visible", true);

            var ingredientsContainer = document.querySelector(`#main-plane-${dish.id}`);
            ingredientsContainer.setAttribute("visible", true);

            var priceplane = document.querySelector(`#price-plane-${dish.id}`);
            priceplane.setAttribute("visible", true)

            // Cambiar la visibilidad del botón div.
            var buttonDiv = document.getElementById("button-div");
            buttonDiv.style.display = "flex";

            var ratingButton = document.getElementById("rating-button");
            var orderButton = document.getElementById("order-button");
            var orderSummaryButtton = document.getElementById("order-summary-button");

            var payButton = document.getElementById("pay-button");


            //Usar eventos de clic
            ratingButton.addEventListener("click", function () {
                swal({
                    icon: "warning",
                    title: "Calificar platillo",
                    text: "Procesando calificación"
                });
            });

            orderButton.addEventListener("click", () => {
                var tNumber;
                tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
                this.handleOrder(tNumber, dish);
                swal({
                    icon: "https://i.imgur.com/4NZ6uLY.jpg",
                    title: "¡Gracias por tu orden!",
                    text: "¡Recibirás tu orden pronto!",
                    timer: 2000,
                    buttons: false
                });
            });
            orderSummaryButtton.addEventListener("click", () =>
                this.handleOrderSummary()
            );

            payButton.addEventListener("click", () => this.handlePayment());
        }
    },

    handleOrder: function (tNumber, dish) {
        // Leer los detalles de la orden para la mesa actual
        firebase
            .firestore()
            .collection("tables")
            .doc(tNumber)
            .get()
            .then(doc => {
                var details = doc.data();

                if (details["current_orders"][dish.id]) {
                    // Incrementar la cantidad actual
                    details["current_orders"][dish.id]["quantity"] += 1;

                    //Calcular el subtotal de un elemento
                    var currentQuantity = details["current_orders"][dish.id]["quantity"];

                    details["current_orders"][dish.id]["subtotal"] =
                        currentQuantity * dish.price;
                } else {
                    details["current_orders"][dish.id] = {
                        item: dish.dish_name,
                        price: dish.price,
                        quantity: 1,
                        subtotal: dish.price * 1
                    };
                }

                details.total_bill += dish.price;

                //Actualizar la base de datos
                firebase
                    .firestore()
                    .collection("tables")
                    .doc(doc.id)
                    .update(details);
            });
    },

    handleMarkerLost: function () {
        // Cambiar la visibilidad del botón div.
        var buttonDiv = document.getElementById("button-div");
        buttonDiv.style.display = "none";
    },
    //Tomar la colección de platillos desde la base de datos Firebase.
    getDishes: async function () {
        return await firebase
            .firestore()
            .collection("dishes")
            .get()
            .then(snap => {
                return snap.docs.map(doc => doc.data());
            });
    },
    getOrderSummary: async function (tNumber) {
        return await firebase
          .firestore()
          .collection("tables")
          .doc(tNumber)
          .get()
          .then(doc => doc.data());
      },
      handleOrderSummary: async function () {
    
        //Obtener el número de mesa
        var tNumber;
        tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
    
        //Obtener el resumen del pedido de la base de datos
        var orderSummary = await this.getOrderSummary(tNumber);
    
        //Cambiar la visibilidad del div modal
        var modalDiv = document.getElementById("modal-div");
        modalDiv.style.display = "flex";
    
        //Obtener el elemento de la mesa
        var tableBodyTag = document.getElementById("bill-table-body");
    
        //Eliminar datos antiguos de tr(fila de la tabla)
        tableBodyTag.innerHTML = "";
    
        //Obtener la clave de current_orders
        var currentOrders = Object.keys(orderSummary.current_orders);
    
        currentOrders.map(i => {
    
          //Crear la fila de la mesa
          var tr = document.createElement("tr");
    
          //Crear celdas/columnas para NOMBRE DEL ARTÍCULO, PRECIO, CANTIDAD y PRECIO TOTAL
          var item = document.createElement("td");
          var price = document.createElement("td");
          var quantity = document.createElement("td");
          var subtotal = document.createElement("td");
    
          //Añadir contenido HTML 
          item.innerHTML = orderSummary.current_orders[i].item;
    
          price.innerHTML = "$" + orderSummary.current_orders[i].price;
          price.setAttribute("class", "text-center");
    
          quantity.innerHTML = orderSummary.current_orders[i].quantity;
          quantity.setAttribute("class", "text-center");
    
          subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
          subtotal.setAttribute("class", "text-center");
    
          //Añadir celdas a la fila
          tr.appendChild(item);
          tr.appendChild(price);
          tr.appendChild(quantity);
          tr.appendChild(subtotal);
    
          //Añadir la fila a la tabla
          tableBodyTag.appendChild(tr);
        });
    
        //Crear una fila para el precio total
        var totalTr = document.createElement("tr");
    
        //Crear una celda vacía (para no tener datos)
        var td1 = document.createElement("td");
        td1.setAttribute("class", "no-line");
    
        //Crear una celda vacía (para no tener datos))
        var td2 = document.createElement("td");
        td1.setAttribute("class", "no-line");
    
        //Crear una celda para el TOTAL
        var td3 = document.createElement("td");
        td1.setAttribute("class", "no-line text-center");
    
        //Crear un elemento <strong> para enfatizar el texto
        var strongTag = document.createElement("strong");
        strongTag.innerHTML = "Total";
    
        td3.appendChild(strongTag);
    
        //Crear una celda para mostrar el importe total de la factura
        var td4 = document.createElement("td");
        td1.setAttribute("class", "no-line text-right");
        td4.innerHTML = "$" + orderSummary.total_bill;
    
        //Añadir celdas a la fila
        totalTr.appendChild(td1);
        totalTr.appendChild(td2);
        totalTr.appendChild(td3);
        totalTr.appendChild(td4);
    
        //Añadir la fila a la mesa
        tableBodyTag.appendChild(totalTr);
      },
      handlePayment: function () {
        // Cerrar el modal
        document.getElementById("modal-div").style.display = "none";
    
        // Obtener el número de la mesa
        var tNumber;
        tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`;
    
        //Restablecer los pedidos actuales y la cuenta total
        firebase
          .firestore()
          .collection("tables")
          .doc(tNumber)
          .update({
            current_orders: {},
            total_bill: 0
          })
          .then(() => {
            swal({
              icon: "success",
              title: "¡Gracias por su compra!",
              text: "¡¡Esperamos que haya disfrutado de su comida!!",
              timer: 2500,
              buttons: false
            });
          });
      }
});
