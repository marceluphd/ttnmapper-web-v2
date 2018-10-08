import { loginConstants } from '../constants'

import { push } from 'react-router-redux';


/**
 * Send the code to the gateway so that the access tokens can be granted
 */
export function sendCodeToBackend(code) {
  return {
    type: loginConstants.SEND_CODE_TO_BACKEND,
    payload: {
      code: code
    }
  }
}