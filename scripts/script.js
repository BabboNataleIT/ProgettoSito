$(document).ready(function () {
    let hiddenElements = $('.hidden');
    hiddenElements.hide(); // Nasconde tutti gli elementi con classe 'hidden' inizialmente

    localStorage.clear(); // Pulisce il localStorage all'inizio
    const map = L.map('map',{
        center: [42.36,12.02], // Centro della mappa
        zoom: 5, // Livello di zoom iniziale
        minZoom: 4,
        maxZoom: 16
    });
    const customIcon = L.icon({
        iconUrl: 'img/oie_transaparent_mini.png',  // or link to an image
        iconSize: [32, 32],        // size of the icon
        iconAnchor: [16, 32],      // point of the icon which will correspond to marker's location
        popupAnchor: [0, -32]      // point from which the popup should open relative to the iconAnchor
    });
    const sheetID = '1FLBwUDrw5AXUsozizV5GGanMQyqEWVKYP3Vlj';
    const baseURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
    // 1. Carica dati da Google Sheets (può essere pubblico o da Apps Script)
    fetch(baseURL)
        .then(res => res.json())
        .then(data => {
            // Salva il primo record nel localStorage
            const userData = data[0]; // puoi anche filtrare o cercare per ID/email/etc.
            localStorage.setItem("prefillData", JSON.stringify(userData));
            prefillForm(userData); // opzionale: subito riempi la form
        });
    const stored = localStorage.getItem("prefillData");
    if (stored) {
        const data = JSON.parse(stored);
        prefillForm(data);
    }

    /*const params = new URLSearchParams(window.location.search);
    const serial = params.get('serial');
    const type = params.get('type');
    prefillForm({ serial, type });*/

    let selectedLgv = "";
    let selectedEquipment = "";
    let selectedPlc = "";
    let currentNecessity = "";
    let checkTicket = "";
    let assistanceDetails = "";

    // Variabili per il caricamento media
    const mediaUploadInput = $('#mediaUploadInput');
    const mediaUploadArea = $('#mediaUploadArea');
    const mediaPreviewContainer = $('#media-preview-container');
    let filesToUpload = []; // Array per memorizzare gli oggetti File da caricare

    localStorage.setItem("customerName", $("#customerName").val());

    // Trigger per l'apertura della finestra di selezione file quando si clicca sull'area di upload
    /*mediaUploadArea.on('click', function() {
        mediaUploadInput.trigger('click');
    });*/

    // Gestione dei file selezionati dall'input
    mediaUploadInput.on('change', function (event) {
        handleFiles(event.target.files);
    });

    // Gestione del drag & drop
    mediaUploadArea.on('dragover', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).css('border-color', '#007bff');
    });

    mediaUploadArea.on('dragleave', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).css('border-color', '#ccc');
    });

    mediaUploadArea.on('drop', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).css('border-color', '#ccc');
        const droppedFiles = event.originalEvent.dataTransfer.files;
        handleFiles(droppedFiles);
    });

    // Funzione per elaborare i file e mostrare le anteprime
    function handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert('Only image and video files are allowed.');
                continue;
            }

            const isDuplicate = filesToUpload.some(existingFile =>
                existingFile.name === file.name && existingFile.size === file.size
            );
            if (isDuplicate) {
                alert(`File "${file.name}" has already been added.`);
                continue;
            }

            filesToUpload.push(file);

            const reader = new FileReader();
            reader.onload = function (e) {
                const mediaItem = $('<div>').addClass('media-preview-item');
                const removeBtn = $('<button>').addClass('remove-btn').text('X').on('click', function () {
                    mediaItem.remove();
                    const index = filesToUpload.indexOf(file);
                    if (index > -1) {
                        filesToUpload.splice(index, 1);
                    }
                    console.log('Files to upload after removal:', filesToUpload);
                });


                if (file.type.startsWith('image/')) {
                    const img = $('<img>').attr('src', e.target.result).attr('alt', file.name);
                    mediaItem.append(img);
                } else if (file.type.startsWith('video/')) {
                    const video = $('<video controls>').attr('src', e.target.result).attr('alt', file.name);
                    mediaItem.append(video);
                }

                mediaItem.append($('<p>').text(file.name));
                mediaItem.append(removeBtn);
                mediaPreviewContainer.show(); // Mostra il contenitore delle anteprime se non visibile
                mediaPreviewContainer.append(mediaItem);
            };
            reader.readAsDataURL(file);
        }
        console.log('Current files to upload:', filesToUpload);
    }

    // Gestione dei radio button "Equipment"
    $('input[name="equipment"]').change(function () {
        $('.hidden').hide(); // Nasconde tutti i div 'hidden'
        $('#necessity').show(); // Mostra sempre la sezione necessity
        // Resetta le selezioni secondarie quando l'equipment cambia
        $('input[name="divLgv-Adv"]').prop('checked', false);
        $('input[name="plc"]').prop('checked', false);
        $('input[name="necessity"]').prop('checked', false);

        selectedLgv = "";
        selectedPlc = "";
        currentNecessity = "";

        selectedEquipment = $(this).val();
        if (selectedEquipment === 'lgv-agv') {
            $('#divLgv-Adv').show();
        } else if (selectedEquipment === 'plc') {
            $('#divPlc').show();
        } else if (selectedEquipment === 'other') {
            $('#divOther').show();
        }
        localStorage.setItem("equipment", selectedEquipment);
    });

    // Gestione del ticket
    $('input[name="ticket"]').change(function () {
        checkTicket = $(this).val();
        $('#divTicket .ticketPrompt, #divTicket #ticketNumber, #divTicket .ticketSeparator').remove();
        if (checkTicket === 'yes') {
            let text = "Ticket Number:";
            $('#divTicket').append('<hr class="ticketSeparator">' + '<p class="ticketPrompt">' + text + '</p><input type="text" name="ticketNumber" id="ticketNumber" placeholder="Please provide the ticket number:" required>');
            localStorage.setItem("ticket", $("#ticketNumber").val());
        } else if (checkTicket === 'no') {
            const ticket = "XXXXXXXXX";
            $('#divTicket').append('<hr class="ticketSeparator">' + '<p class="ticketPrompt">Your ticket number is:</p><input type="text" name="ticketNumber" id="ticketNumber" value="' + ticket + '" readonly>');
            localStorage.setItem("ticket", ticket);
        }

    });

    // Gestione del numero di serie
    $('#serialNumber').on('change', function () {
        let serialNumber = $(this).val();
        if (serialNumber.length < 5) {
            alert('Serial number must be at least 5 characters long.');
        }
        localStorage.setItem("serial", serialNumber);
    });

    $('#pinValue').on('change', function () {
        let x = $(this).val();
        if (x.length < 4) {
            alert('Pin must be at least 4 characters long.')
        }
        localStorage.setItem("pin", x);
    })

    // Gestione della "necessity"
    // Array to keep track of intervention markers
    let interventionMarkers = [];

    $('input[name="necessity"]').change(function () {
        // Nascondi tutte le sezioni di necessità
        $('#divInfo').hide();
        $('#divAssistance').hide();
        $('#mediaUploadSection').addClass('hidden-section'); // Nuova linea: nascondi la sezione media
        $('#ricambiLgvForche').hide();
        $('#ricambiLgvImballaggio').hide();
        $('#ricambiPlc1').hide();
        $('#ricambiPlc2').hide();
        $('#ricambiPlc3').hide();
        $('#mappa').hide();

        currentNecessity = $(this).attr('id');
        let tileLayer;
        if (currentNecessity === 'info') {
            showInfo();
            //$('#divInfo').show();
        } else if (currentNecessity === 'assistance') {
            let media = $('#mediaUploadSection');
            $('#divAssistance').show(); // Mostra la textarea di assistenza
            media.removeClass('hidden-section');
            if (media) { console.log('Media section is visible'); } else { console.log('Media section is not visible'); }
            console.log(media.html());
        } else if (currentNecessity === 'spareParts') {
            showSpareParts();
        } else if (currentNecessity === 'intervention') {
            // Remove existing intervention markers to avoid duplicates
            if (interventionMarkers.length > 0) {
                interventionMarkers.forEach(marker => map.removeLayer(marker));
                interventionMarkers = [];
            }
            if (tileLayer) {
                map.removeLayer(tileLayer);
            }
            tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const locations = [
                { name: 'Barilla', lat: 44.827752, lng: 10.370643 },
                { name: 'Nestle', lat: 45.4104705, lng: 9.1534948 },
                { name: 'Perrier', lat: 44.837789, lng: 10.327157 }
            ];
            locations.forEach(loc => {
                const marker = L.marker([loc.lat, loc.lng]/*,{icon: customIcon}*/).addTo(map)
                    .bindPopup(loc.name)
                    .on('click', () => {
                        document.getElementById('selected-location').textContent = `Selected: ${loc.name}`;
                    });
                interventionMarkers.push(marker);
            });
            const group = L.featureGroup(interventionMarkers);
            map.fitBounds(group.getBounds().pad(0.2));

            $('#mappa').show();
            setTimeout(() => {
                map.invalidateSize();
            }, 100); // piccolo delay per assicurarsi che l'elemento sia effettivamente visibile

        }
        localStorage.setItem("necessity", currentNecessity);
    });

    // Listener per la textarea di assistenza
    $('#assistanceDetails').on('change', function () {
        assistanceDetails = $(this).val();
        alert('Please check to have included these points in your description: Alarm List, Intended Use and Actual Use, Photos and Videos');
    });


    $('input[name="divLgv-Adv"]').change(function () {
        $('#ricambiLgvForche').hide();
        $('#ricambiLgvImballaggio').hide();
        selectedLgv = $(this).attr('id');

        if (currentNecessity === 'spareParts') {
            showSpareParts();
        }
        localStorage.setItem("type", selectedLgv);
    });

    $('input[name="plc"]').change(function () {
        $('#ricambiPlc1').hide();
        $('#ricambiPlc2').hide();
        $('#ricambiPlc3').hide();
        selectedPlc = $(this).attr('id');
        if (selectedPlc === 'plc1') {
            alert('You selected PLC 1');
        } else if (selectedPlc === 'plc2') {
            alert('You selected PLC 2');
        } else if (selectedPlc === 'plc3') {
            alert('You selected PLC 3');
        }

        if (currentNecessity === 'spareParts') {
            showSpareParts();
        }
        localStorage.setItem("type", selectedPlc);
    });

    // Modifica per la gestione del submit (inclusi i file)
    $('#submitBtn').click(function (event) {
        event.preventDefault(); // Previene l'invio del modulo standard

        // Raccogli tutti i dati del form, inclusi i file
        const formData = new FormData($('#information')[0]);

        // Aggiungi i file selezionati all'oggetto FormData
        // ATTENZIONE: Se hai altri campi file nel form, qui potresti avere duplicati.
        // Assicurati che 'mediaFiles' sia unico o gestito correttamente.
        filesToUpload.forEach((file, index) => {
            formData.append(`mediaFiles[${index}]`, file); // 'mediaFiles' sarà il nome del campo sul server
        });

        // Per debug, puoi stampare i dati (esclusi i contenuti dei file)
        console.log('Form data to be submitted:');
        for (let pair of formData.entries()) {
            if (pair[1] instanceof File) {
                console.log(pair[0] + ': ' + pair[1].name + ' (' + pair[1].type + ')');
            } else {
                console.log(pair[0] + ': ' + pair[1]);
            }
        }

        for (let key in localStorage) {
            console.log(`${key}: ${localStorage.getItem(key)}`);
            formData.append(key, localStorage.getItem(key)); // Aggiungi i dati del localStorage a FormData
        }

        // In un'applicazione reale, invieresti formData al server tramite AJAX:
        /*
        $.ajax({
            url: 'your-server-upload-endpoint', // SOSTITUISCI CON IL TUO ENDPOINT DI UPLOAD REALE
            type: 'POST',
            data: formData,
            processData: false, // Importante: non processare i dati
            contentType: false, // Importante: non impostare il Content-Type (il browser lo farà automaticamente per FormData)
            success: function(response) {
                alert('Data and files submitted successfully!');
                console.log(response);
                // Puoi reindirizzare o resettare il form qui
                window.location.href = 'submit-form.html';
            },
            error: function(xhr, status, error) {
                alert('Error submitting data and files!');
                console.error(xhr.responseText);
            }
        });
        */

        // Per ora, simuliamo il successo e reindirizziamo
        alert('Data and files prepared for submission (client-side only). Check console for details.');
        //window.location.href = 'submit-form.html'; // Reindirizza comunque per il tuo flusso attuale
    });

    // Reset completo del modulo
    $('#deselectBtn').click(function () {
        $('input[type="radio"]').prop('checked', false); // Deseleziona tutti i radio button
        $('input[type="text"]').val(''); // Resetta i campi di testo
        $('textarea').val(''); // Resetta le textarea
        $('input[type="datetime-local"]').val(''); // Resetta il campo data/ora

        $('.hidden').hide(); // Nasconde tutti i div nascosti

        // Resetta l'area di caricamento media
        mediaPreviewContainer.empty(); // Svuota le anteprime
        filesToUpload = []; // Svuota l'array dei file da caricare

        // Rimuovi eventuali campi dinamici aggiunti (es. numero ticket)
        $('#divTicket .ticketPrompt, #divTicket #ticketNumber, #divTicket .ticketSeparator').remove();


        // Resetta le variabili di stato
        selectedLgv = "";
        selectedEquipment = "";
        selectedPlc = "";
        currentNecessity = "";
        checkTicket = "";
        assistanceDetails = "";
        localStorage.clear(); // Pulisce il localStorage
    });

    function showSpareParts() {
        $('#ricambiLgvForche').hide();
        $('#ricambiLgvImballaggio').hide();
        $('#ricambiPlc1').hide();
        $('#ricambiPlc2').hide();
        $('#ricambiPlc3').hide();
        if (selectedEquipment === 'lgv-agv') {
            if (selectedLgv === 'forche') {
                $('#ricambiLgvForche').show();
            } else if (selectedLgv === 'imballaggio') {
                $('#ricambiLgvImballaggio').show();
            }
        } else if (selectedEquipment === 'plc') {
            if (selectedPlc === 'plc1') {
                $('#ricambiPlc1').show();
            } else if (selectedPlc === 'plc2') {
                $('#ricambiPlc2').show();
            } else if (selectedPlc === 'plc3') {
                $('#ricambiPlc3').show();
            }
        }
    }

    function showInfo() {
        console.log('Funzione showInfo avviata');
        let img = $('#qr-img');
        $('#divInfo').show();
        let check = true;
        let newSrc = "";

        if (selectedEquipment === 'lgv-agv') {
            if (selectedLgv === 'forche') {
                newSrc = "img/lgvForche.png";
            } else if (selectedLgv === 'imballaggio') {
                newSrc = ""; // oppure una immagine di default
            } else {
                newSrc = ""; // Default image
                alert('Please select a LGV/AGV type before fetching the manuals.');
                check = false;
            }
        } else if (selectedEquipment === 'plc') {
            if (selectedPlc === 'plc1') {
                newSrc = "img/Other.png";
            } else if (selectedPlc === 'plc2') {
                newSrc = "";
            } else if (selectedPlc === 'plc3') {
                newSrc = "";
            } else {
                newSrc = ""; // Default image
                alert('Please select a PLC type before fetching the manuals.');
                check = false;
            }
        } else {
            newSrc = ""; // Default image
            alert('Please select an equipment type before fetching the manuals.');
            check = false;
        }
        console.log(newSrc);

        if (check) {
            img.attr('src', newSrc);
        } else {
            $('#divInfo').hide();
        }
    }
    function prefillForm(data) {
        if (serial) {
            $('#serialNumber').val(serial);
        }
        if (type) {
            if (type.includes('lgv') || type.includes('agv')) {
                $('#lgv-agv').prop('checked', true);
                $('#divLgv-Adv').show();
            } else if (type === 'plc') {
                $('#plc').prop('checked', true);
                $('#divPlc').show();
            } else {
                $('#divOther').val(type);
                $('#other').prop('checked', true);
            }
            $('#equipments').val(type);
        }
    }

    $("#customerName").on('change', save);

    function save() {
        localStorage.setItem(this.id, this.value);
    }
});