import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import md5 from 'md5';

import { client } from 'pokebot/discord';

import Field from 'components/Bulma/Field';

import { MESSAGE_TYPE } from 'containers/Log/constants';

import {
  POKECORD_USERID,
  POKEMON_LIST,
} from 'pokebot/constants';

export default class Container extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isBotting: false,
    };
  }
  componentDidMount() {
    client.on('message', this.onMessage);
  }
  componentWillUnmount() {
    client.removeEventListener('message', this.onMessage);
  }
  onMessage = (message) => {
    if (message.author.id === POKECORD_USERID) {
      if (message.embeds.length > 0) {
        this.onWild(message);
      }
      this.onCatch(message);
      this.onLevelUp(message);
    }
  }
  onCatch = (message) => {
    if (message.content.includes(`Congratulations <@${client.user.id}>`)) {
      this.props.saveMessage({
        author: message.author.username,
        content: message.content.replace(`<@${client.user.id}>`, client.user.username),
        id: message.id,
        image: message.author.avatarURL,
        time: message.createdTimestamp,
        type: MESSAGE_TYPE.CAUGHT,
      });
    }
  }
  onLevelUp = (message) => {
    if (message.content.includes(`Congratulations ${client.user.username}`)) {
      this.props.saveMessage({
        author: message.author.username,
        content: message.content.replace(/`/g, ''),
        id: message.id,
        image: message.author.avatarURL,
        time: message.createdTimestamp,
        type: MESSAGE_TYPE.LEVELUP,
      });
    }
  }
  onWild = async (message) => {
    const {
      delay,
      channelWhitelistArray,
      pokemonWhitelistArray,
    } = this.props;
    const embed = message.embeds[0];
    if (embed.title === 'A wild pokémon has appeared!') {
      const hash = await this.requestImage(embed.image.proxyURL);
      this.props.saveMessage({
        channel: message.channel.name,
        channelId: message.channel.id,
        content: `A wild ${POKEMON_LIST[hash]} has appeared! (${hash})`,
        guild: message.guild.name,
        id: message.id,
        image: embed.image.proxyURL,
        isSpamChannel: message.channel.id === this.props.spammerChannel,
        pokemon: POKEMON_LIST[hash],
        time: message.createdTimestamp,
        type: MESSAGE_TYPE.WILD,
      });
      const shouldCatchPokemon = pokemonWhitelistArray.indexOf(POKEMON_LIST[hash] && POKEMON_LIST[hash].toLowerCase()) > -1 || pokemonWhitelistArray.length === 0;
      const shouldCatchInChannel = channelWhitelistArray.indexOf(message.channel.id) > -1 || channelWhitelistArray.length === 0;
      if (this.state.isBotting && shouldCatchPokemon && shouldCatchInChannel) {
        const catchPokemon = () => {
          const content = `p!catch ${POKEMON_LIST[hash]}`;
          client.channels.get(message.channel.id).send(content);
          const timestamp = Math.floor(Date.now());
          this.props.saveMessage({
            author: client.user.username,
            channel: message.channel.name,
            content,
            guild: message.guild.name,
            id: timestamp,
            image: client.user.avatarURL,
            time: timestamp,
            type: MESSAGE_TYPE.USER,
          });
        };
        const delayTime = parseInt(delay, 10);
        if (delayTime > 0) {
          setTimeout(catchPokemon, delayTime);
        } else {
          catchPokemon();
        }
      }
    }
  }
  requestImage = (url) => (
    axios
    .get(url, { responseType: 'arraybuffer' })
    .then((response) => md5(new Buffer(response.data, 'binary').toString('base64')))
  )
  toggleCatcher = (event) => {
    event.preventDefault();
    this.setState({ isBotting: !this.state.isBotting });
  }
  updateCatcher = (event, field) => {
    event.preventDefault();
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    const params = Object.assign({
      delay: this.props.delay,
      channelWhitelistString: this.props.channelWhitelistString,
      ignoreChannelWhitelist: this.props.ignoreChannelWhitelist,
      pokemonWhitelistString: this.props.pokemonWhitelistString,
      ignorePokemonWhitelist: this.props.ignorePokemonWhitelist,
    }, { [field]: value });
    this.props.updateCatcher(params);
  }
  updateDelay = (event) => {
    this.updateCatcher(event, 'delay');
  };
  updateChannelWhitelist = (event) => {
    this.updateCatcher(event, 'channelWhitelistString');
  };
  updateIgnoreChannelWhitelist = (event) => {
    this.updateCatcher(event, 'ignoreChannelWhitelist');
  };
  updatePokemonWhitelist = (event) => {
    this.updateCatcher(event, 'pokemonWhitelistString');
  };
  updateIgnorePokemonWhitelist = (event) => {
    this.updateCatcher(event, 'ignorePokemonWhitelist');
  };
  render() {
    const { isBotting } = this.state;
    /* eslint-disable jsx-a11y/label-has-for */
    return (
      <div>
        <label className="label">Auto Catch Delay</label>
        <Field hasAddons>
          <p className="control is-expanded">
            <input
              className="input"
              disabled={isBotting}
              onChange={this.updateDelay}
              placeholder="1000"
              type="number"
              value={this.props.delay}
            />
          </p>
          <p className="control">
            <a className="button is-static">ms</a>
          </p>
        </Field>
        <Field>
          <label className="label">Channel Whitelist</label>
          <div className="control">
            <textarea
              className="textarea"
              disabled={isBotting}
              onChange={this.updateChannelWhitelist}
              placeholder="List of Channel IDs"
              value={this.props.channelWhitelistString}
            />
          </div>
          <small>* Leave empty to catch from all channels.</small>
        </Field>
        <Field>
          <label className="label">Pokémon Whitelist</label>
          <div className="control">
            <textarea
              className="textarea"
              disabled={isBotting}
              onChange={this.updatePokemonWhitelist}
              placeholder="Bulbasaur, Charmander, Squirtle"
              value={this.props.pokemonWhitelistString}
            />
          </div>
          <small>* Leave empty to catch all Pokémon.</small>
        </Field>
        <button className={`button is-fullwidth ${isBotting ? 'is-danger' : 'is-info'}`} onClick={this.toggleCatcher}>
          {isBotting ? 'Stop' : 'Start'} Catcher
        </button>
      </div>
    );
    /* eslint-enable jsx-a11y/label-has-for */
  }
}

Container.propTypes = {
  delay: PropTypes.string.isRequired,
  channelWhitelistArray: PropTypes.array.isRequired,
  channelWhitelistString: PropTypes.string.isRequired,
  ignoreChannelWhitelist: PropTypes.bool.isRequired,
  pokemonWhitelistArray: PropTypes.array.isRequired,
  pokemonWhitelistString: PropTypes.string.isRequired,
  ignorePokemonWhitelist: PropTypes.bool.isRequired,
  spammerChannel: PropTypes.string.isRequired,
  saveMessage: PropTypes.func.isRequired,
  updateCatcher: PropTypes.func.isRequired,
};
