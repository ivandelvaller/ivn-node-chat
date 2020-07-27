// Setting the connection with the server.
const socket = io();

// HTML elements.
// From form-message.
const $formMessage = document.querySelector('#form-message');
const $inputMessageElement = $formMessage.querySelector('#input-message');
const $buttonMessageElement = $formMessage.querySelector('#send-message');
const $sendLocationButton = $formMessage.querySelector('#send-location');


// TEMPLATES.
const $templateMessages = document.querySelector('#template-message');
const $templateLocation = document.querySelector('#template-location');
const $templateUsers = document.querySelector('#template-users');

// ELEMENTS.
const $chatBox = document.querySelector('#chat-box');
const $chatFriends = document.querySelector('#chat-friends');

// Options.
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element.
    const $newChatBox = $chatBox;

    // Height of the new chat box.
    const newChatBoxStyles = getComputedStyle($newChatBox);
    const newChatBoxMargin = parseInt(newChatBoxStyles.marginBottom);
    const newChatBoxHeight = $newChatBox.offsetHeight + newChatBoxMargin;
    console.log(newChatBoxHeight);

    // Visible height.
    const visibleHeight = $chatBox.offsetHeight;

    //Height of messages container.
    const containerHeight = $chatBox.scrollHeight;

    // How far have I scrolled?
    const scrollOffset = $newChatBox.scrollTop + visibleHeight;

    if (containerHeight - newChatBoxHeight <= scrollOffset) {
        $chatBox.scrollTop = $chatBox.scrollHeight;
    }
}

// SOCKETS AND LISTENERS.

// EVENT: message listener, to render the messages.
socket.on('message', (message) => {
    // Constants.
    // An element of type string that contain the html code.
    const messagesTemplateElement = $templateMessages.innerHTML;
    // An html code rendered by Mustache.
    const htmlMessage = Mustache.render(messagesTemplateElement, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    });

    // Inserting the html code inside the chat-box.
    $chatBox.insertAdjacentHTML('beforeend', htmlMessage);

    autoscroll();
});

// EVENT: location listener, to render the location.
socket.on('locationMessage', (location) => {
    //Constants
    // This constant contains the html code from the location template.
    const locationTemplateElement = $templateLocation.innerHTML;
    // An html code rendered by Mustache.
    const htmlLocation = Mustache.render(locationTemplateElement, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('hh:mm a')
    });

    $chatBox.insertAdjacentHTML('beforeend', htmlLocation);

    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    // Contsants.
    // This constant contains the html code from the users template.
    const usersTemplateElement = $templateUsers.innerHTML;
    // An html code rendered by Mustache.
    const htmlUsers = Mustache.render(usersTemplateElement, {
        room,
        users
    });
    document.querySelector('#chat-friends').innerHTML = htmlUsers;
}) ;

$buttonMessageElement.addEventListener('click', (event) => {
    event.preventDefault();

    $buttonMessageElement.setAttribute('disabled', 'disabled');

    const message = $inputMessageElement.value;

    socket.emit('sendMessage', message, (error) => {

        $buttonMessageElement.removeAttribute('disabled');
        $inputMessageElement.value = '';
        $inputMessageElement.focus();

        if (error) return console.log(error);

        console.log('Message delivered.');
    });
});


// SendLocationButton, an event to send the location.
// Getting the location via html5.
$sendLocationButton.addEventListener('click', () => {
    // If an error ocurr.
    if (!navigator.geolocation) return alert('Your browser does not support GL.');

    // To disable the location button to prevent send the location many times.
    $sendLocationButton.setAttribute('disabled', 'disabled');

    // Get the geolocation via HTML5
    // The callback contain the coords in an object.
    navigator.geolocation.getCurrentPosition(position => {
        // And object that whose attributes are the longitude and the latitude.
        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        // Emitter to render sendLocation event and a callback to enable the send location button.
        socket.emit('sendLocation', coords, () => {
            $sendLocationButton.removeAttribute('disabled');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) location.href = '/';
})
