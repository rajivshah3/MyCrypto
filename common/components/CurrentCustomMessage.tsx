import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { AppState } from 'reducers';
import { getCurrentTo, ICurrentTo } from 'selectors/transaction';
import { getAllTokens } from 'selectors/config';
import { getWalletInst } from 'selectors/wallet';
import { getAddressMessage } from 'config';
import { Token } from 'types/network';

interface ReduxProps {
  currentTo: ICurrentTo;
  tokens: Token[];
  wallet: AppState['wallet']['inst'];
}

type Props = ReduxProps;

interface State {
  walletAddress: string | null;
}

class CurrentCustomMessageClass extends PureComponent<Props, State> {
  public state: State = {
    walletAddress: null
  };

  public async componentDidMount() {
    this.setAddressState(this.props);
  }

  public componentWillReceiveProps(nextProps: Props) {
    if (this.props.wallet !== nextProps.wallet) {
      this.setAddressState(nextProps);
    }
  }

  public render() {
    const message = this.getMessage();
    if (message) {
      return (
        <div className="clearfix form-group">
          <div className={`alert alert-${message.severity} col-xs-12`}>{message.message}</div>
        </div>
      );
    } else {
      return null;
    }
  }

  private async setAddressState(props: Props) {
    if (props.wallet) {
      const walletAddress = await props.wallet.getAddressString();
      this.setState({ walletAddress });
    } else {
      this.setState({ walletAddress: '' });
    }
  }

  private getMessage() {
    const { currentTo, tokens } = this.props;
    const { walletAddress } = this.state;
    // Make sure all comparisons are lower-cased.
    const address = currentTo.raw.toLowerCase();

    let message;
    let severity;

    // First check against our hard-coded messages
    const msg = getAddressMessage(address);
    if (msg) {
      message = (
        <React.Fragment>
          <p>
            <small>
              A message regarding <strong>{address}</strong>:
            </small>
          </p>
          <p>{msg.msg}</p>
        </React.Fragment>
      );
      severity = msg.severity || 'info';
    }

    // Otherwise check if any of our tokens match the address
    if (!message) {
      const token = tokens.find(tk => tk.address.toLowerCase() === address);
      if (token) {
        message = `
          You’re currently sending to the ${token.symbol} contract. If you
          wanted to send ${token.symbol} to an address, change the To Address to
          where you want it to go, make sure you have a positive ${token.symbol}
          balance in your wallet, and select it from the dropdown next to the
          Amount field.
        `;
        severity = 'warning';
      }
    }

    // Finally check if they're sending to themselves (lol)
    if (walletAddress === address) {
      message = 'You’re sending to yourself. Are you sure you want to do that?';
      severity = 'warning';
    }

    if (message) {
      return {
        message,
        severity
      };
    }
  }
}

export const CurrentCustomMessage = connect((state: AppState): ReduxProps => ({
  currentTo: getCurrentTo(state),
  tokens: getAllTokens(state),
  wallet: getWalletInst(state)
}))(CurrentCustomMessageClass);
