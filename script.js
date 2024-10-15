let chart

function obtenerDatos(){

    const caso=document.getElementById('seleccionar-caso').value
    const url=`https://apidemo.geoeducacion.com.ar/api/testing/control/${caso}`

    fetch(url)
        .then(respuesta=> respuesta.json())
        .then(respuestaJson=>{
            if(respuestaJson.success){
                const valores=respuestaJson.data[0].valores.map(valor=>valor.y)
                const labels=respuestaJson.data[0].valores.map(valor=>valor.x)
                const media=respuestaJson.data[0].media
                const lsc=respuestaJson.data[0].lsc
                const lic=respuestaJson.data[0].lic

                mostrarGrafico(labels,valores,media,lsc,lic)
                verificarAlertas(valores,media,lsc,lic)
            }
        }).catch(error=> console.error('error al cargar los datos', error))

}

function mostrarGrafico(etiquetas, valores, media, lsc, lic){

    const ctx=document.getElementById('chart')
    if(chart){
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type:'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Valores',
                data: valores,
                borderColor: 'red' 
            },{
                label: 'Media',
                data: Array(valores.length).fill(media),
                borderColor: 'green',
                borderDash:[5,5],
            },{
                label: 'Limite Superior de Control',
                data: Array(valores.length).fill(lsc),
                borderColor: 'pink',
                borderDash:[5,5],
            },{
                label: 'Limite Inferior de Control',
                data: Array(valores.length).fill(lic),
                borderColor: 'purple',
                borderDash:[5,5],
            }]
        },
        options: {
            responsive:true,
            scales: {
                y: {
                    suggestedMin: Math.min(...valores)-10,
                    suggestedMax: Math.max(...valores)+10,
                    beginAtZero:false
                }
            }
        }
    })
}

function verificarAlertas(muestra, media, lsc, lic){

    const sigma= calcularDesviacionEstandar(muestra, media, lsc,lic)
    
    const sigmaSup=media+sigma
    const sigmaInf=media-sigma
    const sigmaSup2=media+2*sigma
    const sigmaInf2=media-2*sigma


    //Caso 1- Fuera de control
    muestra.forEach((valor, index)=>{
        if(valor>lsc||valor<lic){
            Swal.fire(`Caso 1- El punto ${index + 1} está fuera de los límites de control, fuera de 2-sigma.`);
        }
    })

    //Caso 3- 2 de 3 puntos fuera de 2-sigma
    for(let i=2; i<muestra.length;i++){

        const puntos=[
            muestra[i-2],
            muestra[i-1],
            muestra[i]
        ]
        const fueraSigma2=puntos.filter(v=> v> sigmaSup2||v<sigmaInf2)

        if(fueraSigma2.length>=2){
            Swal.fire(`Caso 3- dos de tres puntos consecutivos, las muestras ${i-2+1}, ${i-1+1},${i+1} estan fuera del 2-sigma`)
            
        
        }
    }

    //caso 4- 4 de 5 puntos consecutivos fuera de sigma
    for (let i = 4; i < muestra.length; i++) {
        const puntos = [
            muestra[i - 4],
            muestra[i - 3],
            muestra[i - 2],
            muestra[i - 1],
            muestra[i]
        ];
        const fueraSigma = puntos.filter(v => v > sigmaSup || v < sigmaInf);

        if (fueraSigma.length >= 4) {
            Swal.fire(`Caso 4- 4 de 5 puntos consecutivos (muestras ${i - 4 + 1} a ${i + 1} están fuera del sigma)`);
        }
    }

    // caso 5- 8 puntos consecutivos del mismo lado
    for(let i=7; i<muestra.length;i++){
        const puntos=[
            muestra[i-7],
            muestra[i-6],
            muestra[i-5],
            muestra[i-4],
            muestra[i-3],
            muestra[i-2],
            muestra[i-1],
            muestra[i]
        ]
        const mismoLado = puntos.every(v => v > media || v < media);

        if(mismoLado){
            Swal.fire(`Caso 5- 8 puntos consecutivos (muestras ${i-7} a ${i} estan del mismo lado`)
        }
    }

}

function calcularDesviacionEstandar(valores, media){

    const total= valores.reduce((suma, valor)=>{
        return suma+Math.pow(valor-media,2)
    },0)
    const varianza= total/valores.length

    return Math.sqrt(varianza)
}