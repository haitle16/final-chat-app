import React from 'react';
import io from 'socket.io-client';
import Moniker from '../moniker/moniker.js';
import Rooms from '../rooms/rooms.js';
import If from '../if/if.js';

const url = 'https://en-seven-chat-server.herokuapp.com/';
const socket = io.connect(url);

class Chatter extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        typedInput: '',
        rooms: {
            general: {
                wordCount: 0,
                words: [],
                tempNames: [],
                timestamps: [],
            },
            sports: {
                wordCount: 0,
                words: [],
                tempNames: [],
                timestamps: [],
            },
            coding: {
                wordCount: 0,
                words: [],
                tempNames: [],
                timestamps: [],
            },
            fashion: {
                wordCount: 0,
                words: [],
                tempNames: [],
                timestamps: [],
            }
        },
        moniker: '',
        loggedIn: false,
        inputVal: 'Type your message here...',
        error: '',
        currentRoom: 'sports',
        previousRoom: null,
        prevProps: {},
        count: 0,
      };
        socket.on('chat', (payload) => {
            console.log('client chat payload', payload);
            this.updateWords(payload.content);
            this.updateNicknames(payload.moniker);
            this.updateTimestamps(payload.timestamp);
        });
    }

    updateWords = words => {
        this.setState({
            rooms: {...this.state.rooms, [this.state.currentRoom]: {...this.state.rooms[this.state.currentRoom], wordCount: this.state.rooms[this.state.currentRoom].wordCount + 1 }}
        })
        console.log('word count', this.state.rooms[this.state.currentRoom].wordCount);
        if (this.state.rooms[this.state.currentRoom].wordCount > 15) {
            this.state.rooms[this.state.currentRoom].words.shift();
        }
        this.setState({ rooms: {...this.state.rooms, [this.state.currentRoom]: {...this.state.rooms[this.state.currentRoom], words: [...this.state.rooms[this.state.currentRoom].words, words] }} })
        // console.log('word', this.state.rooms[this.state.currentRoom].words);
    };

    updateNicknames = nickname => {
        if (this.state.rooms[this.state.currentRoom].wordCount > 15) {
            this.state.rooms[this.state.currentRoom].tempNames.shift();
        }
        this.setState({ rooms: {...this.state.rooms, [this.state.currentRoom]: {...this.state.rooms[this.state.currentRoom], tempNames: [...this.state.rooms[this.state.currentRoom].tempNames, nickname] }} })
        // console.log('nickname', this.state.rooms[this.state.currentRoom].tempNames);
    };

    updateTimestamps = timestamp => {
        if (this.state.rooms[this.state.currentRoom].wordCount > 15) {
            this.state.rooms[this.state.currentRoom].timestamps.shift();
        }
        this.setState({ rooms: {...this.state.rooms, [this.state.currentRoom]: {...this.state.rooms[this.state.currentRoom], timestamps: [...this.state.rooms[this.state.currentRoom].timestamps, timestamp] }} })
    };

    updateRooms = event => {
        this.setState({ 
            previousRoom: this.state.currentRoom,
            currentRoom: event.target.value 
        })
        socket.emit('room', {current: event.target.value, previous: this.state.currentRoom});
    }

    handleSubmit = event => {
      event.preventDefault();
      event.target.reset();
      socket.emit('submit', {data: this.state.typedInput, room: this.state.currentRoom});
    };

    handleNewWords = event => {
        this.setState({ typedInput: event.target.value });
    };

    handleName = event => {
        this.setState({ moniker: event.target.value });
    };

    handleNameSubmit = event => {
       event.preventDefault();
       this.setState({ 
           moniker: this.state.typedInput,
       });

       socket.emit('new user', this.state.moniker, (data) => {
           if(data) {
               this.setState({
                    loggedIn: true,
               });
               socket.emit('room', {current: this.state.currentRoom, previous: this.state.previousRoom});
           } else {
                this.setState({
                    error: 'This moniker is already taken. Please choose another one.',
                });
           }
       });
    };
  
    render() {
      return (
        <>
        <If condition={!this.state.loggedIn}>
            <Moniker nameTracker={this.handleName} nameSubmit={this.handleNameSubmit} error={this.state.error}/>
        </If>
        <If condition={this.state.loggedIn}>
        <div className='chatWrapper'>
            <div className="roomColumn">
                <Rooms updateRooms={this.updateRooms} current={this.state.currentRoom} previous={this.state.previousRoom} words ={this.state.words} parentState={this.state}/>
            </div>
            <div className="chatColumn">
                <h2>{this.state.currentRoom} room</h2>
                <form onSubmit={this.handleSubmit}>
                    <input
                        className='wordInput'
                        name="typedInput"
                        placeholder={this.state.inputVal}
                        onChange={this.handleNewWords}
                    />
                </form>
                <ul>
                    {Object.keys(this.state.rooms[this.state.currentRoom].words).map((words, idx) => {
                    return (
                        <li key={this.state.rooms[this.state.currentRoom].words.length - (idx + 1)}>
                        {this.state.rooms[this.state.currentRoom].words[this.state.rooms[this.state.currentRoom].words.length - (idx + 1)]} <span className='timestamp'>{this.state.rooms[this.state.currentRoom].tempNames[this.state.rooms[this.state.currentRoom].tempNames.length - (idx + 1)]} ·  {this.state.rooms[this.state.currentRoom].timestamps[this.state.rooms[this.state.currentRoom].timestamps.length - (idx + 1)]} </span>
                        </li>
                    );
                    })}
                </ul>
            </div>
        </div>
        </If>
        </>
      );
    }
  }
  
  export default Chatter;