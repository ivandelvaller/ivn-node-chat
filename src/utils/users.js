const users = [];

// Add user
const addUser = ({ id, username, room }) => {
    // Clean the data.
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // Validate the data
    if (!username || !room) return { error: 'Both username and room are required.' };

    // Check for existing users.
    const userIsRegistered = users.find((user) => {
        return user.room === room && user.username === username;
    });

    // Validate username
    if (userIsRegistered) return { error: 'User already is in the chat.' };

    // Store user.
    const user = {
        id,
        username,
        room
    };

    users.push(user);

    return { user };    
}

// Remove user
const removeUser = (id) => {
    const index = users.findIndex(user => user.id === id);

    if (index !== -1) return users.splice(index, 1)[0];
}

// Get user
const getUser = (id) => {
    return users.find((user) => user.id === id);
}

// Get users in room
const getUsersInRoom = (room) => {
    return users.filter(user => user.room === room);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}