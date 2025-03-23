/*En el controller al descargar el pdf como uso buffer.end no me deja luego redireccionar a ninguna otra página
  por lo que esto tengo que controlarlo desde el cliente*/
document.getElementById('apuntarse').addEventListener('click',async (e) => {
    let id = document.getElementById('idviaje').innerHTML;
    try{
        //convertimos la respuesta (en este caso el pdf) en un blob
        const response = await fetch(`/apuntarse/${id}`);
        const blob = await response.blob();
        //convertimos el blob en una url temporal que solo funcionará mientras la página esté abierta
        const url = window.URL.createObjectURL(blob);
        //abrimos la url del blob en una pestaña nuevo, esto nos mostrará el pdf y podremos descargarlo de forma manual
        window.open(url, "_blank");
    }catch(e){
        console.log(e);
    }
    //ahora si nos dirige a la página de Mis Eventos
    window.location.href='/listaEventos/1';
})