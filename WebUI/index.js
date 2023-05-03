    // Connect to server with the authentication token from the local storage
    const socket = io('http://0.0.0.0:8000', {
        query: {
            token: localStorage.getItem('userid'),
            class_id : localStorage.getItem('class_id')
        }
    });

    socket.on('connect', (msg) => {
        console.log('Connected to server', msg);
       if (msg != undefined) {
        renderChatBox(msg);
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('chat', (msg) => {
        console.log(msg);
        // if msg is  not undefined
        if (msg) {
        renderChatBox(msg);
        }
        // renderChatBox(msg);
    });

    $('.userid_submit').on('click', function() {
        const userid = $('#username').val();
        console.log(userid);
        if (userid) {
            localStorage.setItem('userid', userid);
            location.reload();
        } else {
            alert('Please enter a valid userid');
        }
    });

    $('.chatInput').on('keydown', function(event) {
        if (event.which === 13) { // 13 corresponds to Enter key
            event.preventDefault();
            $('.sendChat').trigger('click');
        }
    });

    $('.sendChat').on('click', function() {
        const chatInput = $('.chatInput').val();
        if (chatInput) {
            sendChat(chatInput);
        }
    });

    $('#file-upload').on('change', function() {
        var file_data = $(this).prop('files')[0];
        console.log(file_data);
        var form_data = new FormData();
        form_data.append('id', localStorage.getItem('userid'));
        form_data.append('file', file_data);
        let urlData = "";
        let fileModeType = "";
        if (file_data.type == 'text/csv') {
            urlData = "http://127.0.0.1:5000/saveCSV_file"
            fileModeType = "CSV";
        } else if (file_data.type == 'application/pdf') {
            urlData = "http://127.0.0.1:5000/savePDF_file"
            fileModeType = "PDF";
        }

        $.ajax({
            url: urlData,
            type: 'POST',
            data: form_data,
            contentType: false,
            processData: false,
            success: function(response) {
                console.log(response);
                if (response.message == "fileModeEnabled") {
                    localStorage.setItem('fileModeEnabled', true);
                    localStorage.setItem('fileModeType', fileModeType);
                    location.reload();
                    // botStatus button show
                    $('.botStatus').show();
                }
            }
        });
    });

    $('.botStatus').on('click', function() {
        localStorage.removeItem('fileModeEnabled');
        localStorage.removeItem('fileModeType');
        location.reload();
    });

    $('.botDevStatus').on('click', function() {
        localStorage.removeItem('devModeEnabled');
        location.reload();
    });

    $('.developer-btn').on('click', function() {
        enableDevMode();
    });

    function formatCodeSnippets(str) {
        const regex = /```([\w-]+)?\n([\s\S]+?)\n```/gm;
        const formattedStr = str.replace(regex, '<pre class="line-numbers"><code data-prismjs-copy="Copy" class="language-$1">$2</code></pre>');
        return formattedStr;
    }

    function formatImageLinks(str) {
        // regex to find links to images eg: https://www.google.com/images/abc.png
        const regex = /https?:\/\/\S+\.(?:png|jpg|jpeg|gif|svg)/gm;
        const formattedStr = str.replace(regex, '<img src="$&" class="img-fluid" alt="Responsive image">');

        function checkImage(url, callback) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (callback && typeof callback === "function") {
                        callback(xhr.status === 200);
                    }
                }
            };

            xhr.send(null);
        }

        const foundLinks = formattedStr.match(regex);
        if (foundLinks) {
            foundLinks.forEach((link) => {
                checkImage(link, (isValid) => {
                    if (!isValid) {
                        const invalidImgTag = `<img src="${link}" class="img-fluid" alt="Responsive image">`;
                        const updatedStr = formattedStr.replace(invalidImgTag, '');
                        console.log(updatedStr);
                        return updatedStr;
                    }
                });
            });
        }
        return formattedStr;
    }

    function formatLinks(str) {
        // regex to find links eg: https://www.google.com
        const regex = /https?:\/\/\S+/gm;
        const formattedStr = str.replace(regex, '<a href="$&" target="_blank">$&</a>');
        return formattedStr;
    }

    function renderChatBox(chatData) {
        // delete the existing chat box
        const chatDiv = document.querySelector('.chat-div');


        chatDiv.innerHTML = '';

        //  chatData = [
        //     {
        //         "role": "assistant",
        //         "content": "Hello, I am your assistant. How can I help you?",
        //      "to_be_sent": "All"
        //     },
        //     {
        //         "role": "user",
        //         "content": "I want to know about the course",
        //         "to_be_sent": "BadBoy17G"  
        //     }]

        chatData.forEach(chat => {
            console.log(chat.to_be_sent, localStorage.getItem('userid'));
            if(chat.to_be_sent == localStorage.getItem('userid') || chat.to_be_sent == "All"){
            chat.content = formatCodeSnippets(chat.content);
            chat.content = formatImageLinks(chat.content);
            chat.content = formatLinks(chat.content)
            let newChat = document.createElement('div');
            newChat.classList.add(chat.role === 'mentor' ? 'bot-chat' : 'user-chat');
            let innerDiv = document.createElement('div');
            innerDiv.classList.add('d-inline-block', chat.role === 'mentor' ? 'float-left' : 'float-right', 'mb-1');
            innerDiv.style.maxWidth = '50%';
            let pText = document.createElement('p');
            pText.classList.add(chat.role === 'mentor' ? 'bg-danger' : 'bg-primary', 'text-white', 'py-2', 'px-3', 'rounded', 'text-break');
            pText.style.whiteSpace = 'pre-wrap';
            pText.innerHTML = chat.content;
            innerDiv.appendChild(pText);
            newChat.appendChild(innerDiv);
            let clearDiv = document.createElement('div');
            clearDiv.classList.add('clearfix');
            newChat.appendChild(clearDiv);
            chatDiv.appendChild(newChat);
            }
        });

        chatDiv.scrollTop = chatDiv.scrollHeight;

    }

    function initSpeechService() {
        const constraints = { audio: true };
        let chunks = [];

        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                const audioMimeType = 'audio/webm;codecs=opus' ||
                    'audio/ogg;codecs=opus' ||
                    'audio/webm;codecs=pcm' ||
                    'audio/webm;codecs=pcm' ||
                    'audio/wav';
                // eslint-disable-next-line max-len
                const mediaRecorder = new MediaRecorder(stream, { mimeType: audioMimeType, audioBitsPerSecond: 128000 });

                mediaRecorder.addEventListener('dataavailable', (e) => {
                    chunks.push(e.data);
                    $('#play-icon').hide();
                    $('#loading-icon').show();
                    const formData = new FormData();
                    formData.append('id', localStorage.getItem('userid'));
                    // delete everything except last array element
                    chunks = chunks.slice(chunks.length - 1);
                    formData.append('audio', new Blob(chunks));
                    fetch('http://127.0.0.1:5000/send_audio', {
                            method: 'POST',
                            body: formData,
                        })
                        //  data received from server is audio file
                        .then((response) => response.json())
                        .then((data) => {
                            data.response.splice(0, 3);
                            renderChatBox(data.response);
                            const audio = document.querySelector('audio');
                            const audioData = data.audio;
                            const decodedAudioData = atob(audioData);
                            const byteNumbers = new Array(decodedAudioData.length);
                            for (let i = 0; i < decodedAudioData.length; i++) {
                                byteNumbers[i] = decodedAudioData.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
                            audio.src = URL.createObjectURL(audioBlob);
                            audio.play();
                            $('.spinnerButton').hide();
                            $('.spinnerButton').prop('disabled', true);
                            $('.micButton').show();
                            $('.micButton').prop('disabled', false);
                            $('.sendChat').show();

                        });
                });



                // Start recording when button is clicked
                document.querySelector('.micButton').addEventListener('click', () => {
                    // hide the sendChat button
                    $('.sendChat').hide();
                    $('.micButton').prop('disabled', true);
                    $('.micButton').hide();
                    $('.stopButton').show();
                    $('.stopButton').prop('disabled', false);
                    mediaRecorder.start();
                });

                // Stop recording and send audio file to server
                document.querySelector('.stopButton').addEventListener('click', () => {
                    mediaRecorder.stop();
                    $('.stopButton').hide();
                    $('.stopButton').prop('disabled', true);
                    $('.spinnerButton').show();
                    $('.spinnerButton').prop('disabled', false);
                });
            })
            .catch((err) => console.error(err));
    }

    function enableDevMode() {
        $('.gradient-bg').addClass('gradient-bg-transition');
        $('.botDevStatus').removeClass('d-none');
        localStorage.setItem('devModeEnabled', true);
        $('.chat-div').html('');
        let chatBubble = `<div class="bot-chat"><div class="d-inline-block float-left mb-1" style="max-width: 50%;">
    <p class="bg-danger py-2 px-3 rounded text-break text-white" style="white-space: pre-wrap;">Developer Mode Enabled</p>
    </div> <div class="clearfix"></div>
    </div>`;
        $('.chat-div').append(chatBubble);
        chatBubble = `<div class="bot-chat"><div class="d-inline-block float-left mb-1" style="max-width: 50%;">
    <p class="bg-danger py-2 px-3 rounded text-break text-white" style="white-space: pre-wrap;">Enter the Project Name or Folder Name</p>
    <div class="clearfix"></div></div>`;
        $('.chat-div').append(chatBubble);

    }

    function loadChats() {
        $.ajax({
            type: "POST",
            url: "http://127.0.0.1:5000/load_chat",
            data: { 'chatId': localStorage.getItem('userid') },
            success: function(response) {
                // remove first four elements from the array response.response
                response.response.splice(0, 3);
                renderChatBox(response.response);
                // auto scroll to the bottom of the chat box
                $('.chat-div').scrollTop($('.chat-div')[0].scrollHeight);
            }
        });

        if (localStorage.getItem('fileModeEnabled')) {
            $('.botStatus').removeClass('d-none');
            //  loop the below unlimited times
            startColorLoop();
        } else if (localStorage.getItem('devModeEnabled')) {
            enableDevMode();
        } else {
            $('.gradient-bg').css({
                'background': 'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%);'
            });
        }

    }

    function startColorLoop() {
        let i = 0;

        const intervalId = setInterval(() => {
            // Change the background gradient color
            $('.gradient-bg').css({
                'background': 'linear-gradient(' + i + 'deg, #7F00FF 0%, #E105FF 100%)'
            });
            // Increment the angle by 1 degree
            i = (i + 0.5) % 360;
        }, 1);

        return intervalId; // Return interval ID so it can be stopped/cleared later if needed
    }

    function sendChat(chatInput) {
        const sendChatButton = $('.sendChat');
        const originalHTML = sendChatButton.html();
        $('.chatInput').val('');
        sendChatButton.prop('disabled', true);
        sendChatButton.html('<i class="fas fa-spinner fa-spin"></i>');
        // let chatData = { 'chatInput': chatInput, 'chatId': localStorage.getItem('userid') }

        try {
            let obj  = {
                'chatContent': chatInput,
                'classID': localStorage.getItem('class_id'),
                'userID': localStorage.getItem('userid'),
            }
            socket.emit('chat', obj);
        } catch (error) {
            // remove the spinner
            sendChatButton.html(originalHTML);
            sendChatButton.prop('disabled', false);
            // show the error message
        } finally {
            // remove the spinner
            sendChatButton.html(originalHTML);
            sendChatButton.prop('disabled', false);
        }


        
        
    }

    $(document).ready(function() {
        // check if userid is present in local storage
        if (localStorage.getItem('userid')) {
            // userNameButton with text
            $('.userNameButton').text(localStorage.getItem('userid'));
            // and change the color of the button using class btn-primary instead of btn-secondary
            $('.userNameButton').removeClass('btn-secondary');
            $('.userNameButton').addClass('btn-primary');
            // loadChats();
        } else {
            // hide 
            // open a modal to ask for userid
            $('#useridModal').modal('show');
        }
        // scroll to the bottom of the chat box
        $('.chat-div').scrollTop($('.chat-div').prop('scrollHeight'));
        // initSpeechService();

    });