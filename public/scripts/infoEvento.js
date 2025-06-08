document.getElementById('apuntarse').addEventListener('click', async (e) => {
    e.preventDefault();  // evitar comportamiento normal del link

    let id = document.getElementById('idviaje').innerText.trim();

    try {
        // Abrimos una pestaña vacía para evitar bloqueo de popup
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
            alert('Por favor, permite ventanas emergentes para esta página.');
            return;
        }

        const response = await fetch(`/apuntarse/${id}`);
        if (!response.ok) throw new Error('Error al descargar el PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Cargamos el PDF en la pestaña recién abierta
        newWindow.location.href = url;

        // Redireccionamos la página actual tras 2 segundos para dejar tiempo a cargar PDF
        setTimeout(() => {
            window.location.href = '/listaEventos/1';
        }, 2000);

    } catch (e) {
        console.error(e);
        alert('Error al descargar el PDF.');
    }
});
