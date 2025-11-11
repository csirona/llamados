import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Clientes SSE
let clientes = [];
// Llamados activos
let llamados = [];

// SSE endpoint
app.get("/stream", (req, res) => {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });
    res.flushHeaders();

    clientes.push(res);
    res.write(`data: ${JSON.stringify(llamados)}\n\n`);

    req.on("close", () => {
        clientes = clientes.filter(c => c !== res);
    });
});

// Notificar a todos los clientes SSE
function notifyAll() {
    for (const client of clientes) {
        client.write(`data: ${JSON.stringify(llamados)}\n\n`);
    }
}

// Crear un llamado (solo caja y hora)
app.post("/llamado", (req, res) => {
    const { caja } = req.body;
    if (!caja) return res.status(400).json({ message: "Se requiere número de caja" });

    const hora = new Date().toLocaleTimeString();
    llamados.push({ caja, hora });
    notifyAll();
    res.status(201).json({ message: "Llamado creado", caja, hora });
});

// Desactivar llamado enviando solo el número de caja
app.delete("/llamado/:caja", (req, res) => {
    const { caja } = req.params;
    llamados = llamados.filter(l => l.caja != caja);
    notifyAll();
    res.sendStatus(200);
});

app.listen(3033, () => console.log("Backend escuchando en http://localhost:3033"));
