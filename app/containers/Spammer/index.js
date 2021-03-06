import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  selectChannel,
  selectInterval,
  selectMessageListArray,
  selectMessageListString,
} from 'pokebot/selectors';

import { updateSpammerAction } from 'pokebot/actions';

import Container from './container';

const mapStateToProps = createStructuredSelector({
  channel: selectChannel(),
  interval: selectInterval(),
  messageListArray: selectMessageListArray(),
  messageListString: selectMessageListString(),
});

export const mapDispatchToProps = (dispatch) => ({
  updateSpammer: (params) => dispatch(updateSpammerAction.request(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Container);
