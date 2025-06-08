document.querySelectorAll('.btn-aceptar').forEach(boton => {
    boton.addEventListener('click', async (e) => {
        e.preventDefault();
        const idSolicitud = boton.dataset.id;

        try {
            const newWindow = window.open('', '_blank');
            if (!newWindow) {
                alert('Por favor, permite ventanas emergentes para esta página.');
                return;
            }

            const response = await fetch(`/solicitud_aceptar/${idSolicitud}/1`);
            if (!response.ok) throw new Error('Error al aceptar la solicitud o generar el PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            newWindow.location.href = url;

            setTimeout(() => {
                window.location.href = '/listaEventos/1';
            }, 2000);

        } catch (error) {
            console.error(error);
            alert('Hubo un error al aceptar la solicitud.');
        }
    });
});