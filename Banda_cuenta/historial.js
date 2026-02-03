import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Tu configuración de Firebase
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

async function cargarHistorial() {
    const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    const tabla = document.getElementById("tablaHistorial");
    
    tabla.innerHTML = ""; 
    
    querySnapshot.forEach((doc) => {
        const d = doc.data();
        // Convertir fecha de Firebase a texto legible
        const fecha = d.fecha ? d.fecha.toDate().toLocaleString() : "Sin fecha";
        
        tabla.innerHTML += `
            <tr>
                <td>${fecha}</td>
                <td style="color: ${d.tipo === 'Ingreso' ? '#22c55e' : '#ef4444'}">${d.tipo}</td>
                <td>$${d.cantidad}</td>
                <td>${d.motivo}</td>
            </tr>
        `;
    });
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarHistorial);