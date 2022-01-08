const socket = io();

const $formMessage = document.querySelector('#form-message');
const $inputMessageElement = $formMessage.querySelector('#input-message');
const $buttonMessageElement = $formMessage.querySelector('#send-message');
const $sendLocationButton = $formMessage.querySelector('#send-location');

const $templateMessages = document.querySelector('#template-message');
const $templateLocation = document.querySelector('#template-location');
const $templateUsers = document.querySelector('#template-users');

const $chatBox = document.querySelector('#chat-box');
const $chatFriends = document.querySelector('#chat-friends');

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    const $newChatBox = $chatBox;

    const newChatBoxStyles = getComputedStyle($newChatBox);
    const newChatBoxMargin = parseInt(newChatBoxStyles.marginBottom);
    const newChatBoxHeight = $newChatBox.offsetHeight + newChatBoxMargin;

    const visibleHeight = $chatBox.offsetHeight;

    const containerHeight = $chatBox.scrollHeight;

    const scrollOffset = $newChatBox.scrollTop + visibleHeight;

    if(containerHeight - newChatBoxHeight <= scrollOffset) {
        $chatBox.scrollTop = $chatBox.scrollHeight;
    }
};

socket.on('message', (message) => {
    const messagesTemplateElement = $templateMessages.innerHTML;
    const htmlMessage = Mustache.render(messagesTemplateElement, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    });
    $chatBox.insertAdjacentHTML('beforeend', htmlMessage);
    autoscroll();
});

socket.on('locationMessage', (location) => {
    const locationTemplateElement = $templateLocation.innerHTML;
    const htmlLocation = Mustache.render(locationTemplateElement, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('hh:mm a')
    });
    $chatBox.insertAdjacentHTML('beforeend', htmlLocation);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const usersTemplateElement = $templateUsers.innerHTML;
    const htmlUsers = Mustache.render(usersTemplateElement, {
        room,
        users
    });
    document.querySelector('#chat-friends').innerHTML = htmlUsers;
});

$buttonMessageElement.addEventListener('click', (event) => {
    event.preventDefault();
    $buttonMessageElement.setAttribute('disabled', 'disabled');
    const message = $inputMessageElement.value;
    socket.emit('sendMessage', message, (error) => {
        $buttonMessageElement.removeAttribute('disabled');
        $inputMessageElement.value = '';
        $inputMessageElement.focus();
        if(error) return console.log(error);
    });
});

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) return alert('Your browser does not support GL.');
    $sendLocationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition(position => {
        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        socket.emit('sendLocation', coords, () => {
            $sendLocationButton.removeAttribute('disabled');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if(error) location.href = '/';
});
