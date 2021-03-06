import React, { Component } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'
import { loginConstants } from '../../constants'

import { sendCodeToBackend } from '../../actions/login-actions'

class _LoggedIn extends Component {

  constructor(props) {
    super(props)

    this.loggedInParams = { code: null, state: null } // parameters from just logging in
    this.timer = null

    this.tick = this.tick.bind(this)
  }

  render() {
    if (this.props.loggedIn === loginConstants.LoggedIn) {
      try {
        const returnedState = JSON.parse(atob(this.loggedInParams.state))
        if ('l' in returnedState) {
          return (<Redirect to={returnedState.l} />)
        }
      }
      catch (e) { }

      return (<Redirect to={'/user'} />)

    }
    else {
      // Keep rendering this until we are logged in
      return (
        <div className="container textBlock">
          <div className="loading-div card">
            <span >Logging in...</span>
            <span className="oi" id="loading" data-glyph="cog" title="icon name" aria-hidden="true"></span>
          </div>
        </div>
      )
    }
  }

  componentDidMount() {
    if ('location' in this.props && 'search' in this.props.location && this.props.location.search !== "") {
      var partsOfStr = this.props.location.search.substring(1).split('&');

      for (var ind in partsOfStr) {
        //Split into name and value
        var assignment = partsOfStr[ind].split('=', 2)
        if (assignment.length == 2) {
          switch (assignment[0]) {
            case 'code': this.loggedInParams.code = assignment[1]; break;
            case 'state': this.loggedInParams.state = assignment[1]; break;
          }
        }
      }
      if (this.loggedInParams.state && this.loggedInParams.code) {
        this.props.sendCodeToBackend(this.loggedInParams.code)
      }
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {

    // If we have made the request, and received the login tickets, set a timer
    if ('loginTicket' in this.props.loginTicket) {
      let timer = setInterval(this.tick, 3000);
      this.timer = timer
      //this.setState({timer});
    }
  }

  tick() {
    console.log("Tick!")
    this.props.checkLoginTicketStatus(this.props.loginTicket)
    console.log(this)
  }
}



const mapStateToProps = state => {
  return {
    loggedIn: state.userData.userState.loggedIn,
    loginTicket: state.userData.userState.tokens
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  sendCodeToBackend: (code) => dispatch(sendCodeToBackend(code)),
  checkLoginTicketStatus: (ticket) => dispatch(checkLoginTicketStatus(ticket))
})

const LoggedIn = connect(mapStateToProps, mapDispatchToProps)(_LoggedIn)

export default LoggedIn
export { _LoggedIn }
