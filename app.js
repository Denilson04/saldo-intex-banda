import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signInAnonymously, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBE0OTLVYBSJn3bQHXdt_3Q5sIR52FTIww",
  authDomain: "saldo-intex-marching-band.firebaseapp.com",
  projectId: "saldo-intex-marching-band",
  storageBucket: "saldo-intex-marching-band.firebasestorage.app",
  messagingSenderId: "566925860224",
  appId: "1:566925860224:web:ea8866d53316838e12f565"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const btnHistorial = document.getElementById("btnHistorial");

document.addEventListener("DOMContentLoaded", () => {
    // Referencias exactas (CUIDADO con las mayúsculas/minúsculas)
    const pantallaLogin = document.getElementById("pantallaLogin");
    const btnEntrar = document.getElementById("btnEntrar");
    const btnInvitado = document.getElementById("btnInvitado");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    
    const btnIngresar = document.getElementById("btnIngresar");
    const btnRetirar = document.getElementById("btnRetirar");
    const saldoTexto = document.getElementById("saldo");

    let saldoTotal = 0;

    /*************************
     * 🔐 ACCESOS
     *************************/

    // Entrar como Tesorero
    btnEntrar.onclick = async () => {
        const email = document.getElementById("email").value;
        const pass = document.getElementById("password").value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (e) { alert("Error: Datos incorrectos"); }
    };

    // Entrar como Invitado (Corregido)
    btnInvitado.onclick = async () => {
        try {
            await signInAnonymously(auth);
            console.log("Acceso invitado exitoso");
        } catch (e) {
            console.error("Fallo anónimo:", e);
            // Si falla el servidor, entramos por la fuerza:
            pantallaLogin.style.display = "none";
            actualizarInterfaz(null);
            cargarSaldo();
        }
    };

    // Salir
    btnCerrarSesion.onclick = () => signOut(auth).then(() => location.reload());

    /*************************
     * 🚥 CONTROL DE VISTA
     *************************/
    onAuthStateChanged(auth, (user) => {
        if (user) {
            pantallaLogin.style.display = "none";
            btnCerrarSesion.style.display = "block";
            actualizarInterfaz(user);
            cargarSaldo();
        } else {
            pantallaLogin.style.display = "flex";
            btnCerrarSesion.style.display = "none";
        }
    });

    function actualizarInterfaz(user) {
        // Solo el correo del tesorero puede ver botones de acción
        if (user && user.email === "tesorero@intex.com") {
            btnIngresar.style.display = "inline-block";
            btnRetirar.style.display = "inline-block";
        } else {
            btnIngresar.style.display = "none";
            btnRetirar.style.display = "none";
        }
    }

    /*************************
     * 💰 DINERO
     *************************/
    async function cargarSaldo() {
        const q = query(collection(db, "movimientos"), orderBy("fecha", "asc"));
        const snap = await getDocs(q);
        saldoTotal = 0;
        snap.forEach(doc => {
            const d = doc.data();
            saldoTotal += (d.tipo === "Ingreso" ? d.cantidad : -d.cantidad);
        });
        saldoTexto.innerText = `Saldo actual: $${saldoTotal.toFixed(2)}`;
    }


    // --- BOTÓN INGRESAR ---
    btnIngresar.onclick = async () => {
        const cant = prompt("Monto a ingresar:");
        if (cant === null || cant === "") return; // Detener si cancela
        
        const numCant = Number(cant);
        if (numCant > 0) {
            const mot = prompt("Motivo:");
            if (mot === null || mot === "") return; // Detener si cancela motivo

            await addDoc(collection(db, "movimientos"), { 
                tipo: "Ingreso", 
                cantidad: numCant, 
                motivo: mot, 
                fecha: new Date() 
            });
            cargarSaldo();
        } else {
            alert("Monto inválido");
        }
    };

    // --- BOTÓN RETIRAR ---
    btnRetirar.onclick = async () => {
        const cant = prompt("Monto a retirar:");
        if (cant === null || cant === "") return;

        const numCant = Number(cant);
        if (numCant > 0 && numCant <= saldoTotal) {
            const mot = prompt("Motivo:");
            if (mot === null || mot === "") return;

            await addDoc(collection(db, "movimientos"), { 
                tipo: "Retiro", 
                cantidad: numCant, 
                motivo: mot, 
                fecha: new Date() 
            });
            cargarSaldo();
        } else {
            alert("Monto inválido o saldo insuficiente");
        }
    };

    // Función para cargar los datos
async function cargarDatos(esTesorero) {
    const tabla = document.getElementById("tablaHistorial");
    const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    
    tabla.innerHTML = ""; 
    querySnapshot.forEach((documento) => {
        const d = documento.data();
        const id = documento.id; // Necesitamos el ID para borrarlo
        const fechaTxt = d.fecha ? d.fecha.toDate().toLocaleString() : "---";
        
        // Si es tesorero, agregamos un botón de basura 🗑️
        const botonBorrar = esTesorero 
            ? `<td><button onclick="eliminarMovimiento('${id}')" style="background:none; border:none; cursor:pointer;">🗑️</button></td>` 
            : "";

        tabla.innerHTML += `
            <tr id="fila-${id}">
                <td>${fechaTxt}</td>
                <td class="${d.tipo}">${d.tipo}</td>
                <td>$${Number(d.cantidad).toFixed(2)}</td>
                <td>${d.motivo}</td>
                ${botonBorrar}
            </tr>
        `;
    });
}

// Función global para eliminar (se conecta al botón 🗑️)
window.eliminarMovimiento = async (id) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
        try {
            await deleteDoc(doc(db, "movimientos", id));
            alert("Eliminado correctamente");
            location.reload(); // Recargamos para actualizar el saldo total
        } catch (error) {
            alert("No tienes permiso para borrar.");
        }
    }
};

// Verificamos quién está mirando la página
onAuthStateChanged(auth, (user) => {
    const esTesorero = (user && user.email === "tesorero@intex.com");
    cargarDatos(esTesorero);
});

    // --- BOTÓN HISTORIAL ---
    if (btnHistorial) {
        btnHistorial.onclick = () => {
            window.location.href = "historial.html";
        };
    } else {
        console.error("No se encontró el botón con id='btnHistorial'");
    }
    
});