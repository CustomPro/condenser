import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import tt from 'counterpart';
import classnames from 'classnames';
import { memo } from '@steemit/steem-js';

class Memo extends React.Component {
    static propTypes = {
        text: PropTypes.string,
        username: PropTypes.string,
        isFromBadActor: PropTypes.bool.isRequired,
        otherAccount: PropTypes.string,
        // redux props
        myAccount: PropTypes.bool,
        memo_private: PropTypes.object,
        involvesNegativeRepUser: PropTypes.bool.isRequired,
    };

    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Memo');
        this.state = {
            revealBadActorMemo: false,
            revealNegativeRepMemo: false,
        };
    }

    decodeMemo(memo_private, text) {
        try {
            return memo.decode(memo_private, text);
        } catch (e) {
            console.error('memo decryption error', text, e);
            return 'Invalid memo';
        }
    }

    onRevealBadActorMemo = e => {
        e.preventDefault();
        this.setState({ revealBadActorMemo: true });
    };

    onRevealNegativeRepMemo = e => {
        e.preventDefault();
        this.setState({ revealNegativeRepMemo: true });
    };

    render() {
        const { decodeMemo } = this;
        const {
            memo_private,
            text,
            myAccount,
            isFromBadActor,
            involvesNegativeRepUser,
        } = this.props;
        const isEncoded = /^#/.test(text);

        if (!text || text.length < 1) return <span />;

        const classes = classnames({
            Memo: true,
            'Memo--badActor': isFromBadActor,
            'Memo--involvesNegativeRepUser': involvesNegativeRepUser,
            'Memo--private': memo_private,
        });

        let renderText = '';

        if (!isEncoded) {
            renderText = text;
        } else if (memo_private) {
            renderText = myAccount
                ? decodeMemo(memo_private, text)
                : tt('g.login_to_see_memo');
        }

        if (isFromBadActor && !this.state.revealBadActorMemo) {
            renderText = (
                <div className="bad-actor-warning">
                    <div className="bad-actor-caution">
                        {tt('transferhistoryrow_jsx.bad_actor_caution')}
                    </div>
                    <div className="bad-actor-explained">
                        {tt('transferhistoryrow_jsx.bad_actor_explained')}
                    </div>
                    <div
                        className="ptc bad-actor-reveal-memo"
                        role="button"
                        onClick={this.onRevealBadActorMemo}
                    >
                        {tt('transferhistoryrow_jsx.bad_actor_reveal_memo')}
                    </div>
                </div>
            );
        }

        if (involvesNegativeRepUser && !this.state.revealNegativeRepMemo) {
            renderText = (
                <div className="involves-negative-rep-user-warning">
                    <div className="involves-negative-rep-user-caution">
                        {tt(
                            'transferhistoryrow_jsx.involves_negative_rep_user_caution'
                        )}
                    </div>
                    <div className="involves-negative-rep-user-explained">
                        {tt(
                            'transferhistoryrow_jsx.involves_negative_rep_user_explained'
                        )}
                    </div>
                    <div
                        className="ptc involves-negative-rep-user-reveal-memo"
                        role="button"
                        onClick={this.onRevealNegativeRepMemo}
                    >
                        {tt(
                            'transferhistoryrow_jsx.involves_negative_rep_user_reveal_memo'
                        )}
                    </div>
                </div>
            );
        }

        return <span className={classes}>{renderText}</span>;
    }
}

export default connect((state, ownProps) => {
    const currentUser = state.user.get('current');
    const myAccount =
        currentUser && ownProps.username === currentUser.get('username');
    const memo_private =
        myAccount && currentUser
            ? currentUser.getIn(['private_keys', 'memo_private'])
            : null;
    const involvesNegativeRepUser =
        parseInt(
            state.global.getIn([
                'accounts',
                ownProps.otherAccount,
                'reputation',
            ]),
            10
        ) < 0 ||
        parseInt(
            state.global.getIn(['accounts', ownProps.username, 'reputation']),
            10
        ) < 0;
    return { ...ownProps, memo_private, myAccount, involvesNegativeRepUser };
})(Memo);
