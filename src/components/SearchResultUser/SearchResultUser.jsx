import React from 'react';
import PropTypes from 'prop-types';
import './SearchResultUser.css';
import { useNavigate } from 'react-router-dom';

function SearchResultUser({ user }) {
  const navigate = useNavigate();
  return (
    <div
      className="userResult-item"
      role="link"
      tabIndex={0}
      onClick={() => {
        navigate(`/main/userprofile/${user.userID}`, {
          state: { usr: user.userID }
        });
      }}
      onKeyDown={() => {
        navigate(`/main/userprofile/${user.userID}`, {
          state: { usr: user.userID }
        });
      }}>
      <img className="profile-usrpic" src={user.userPic} alt="user avatar" />
      <span>@{user.username}</span>
    </div>
  );
}

export default SearchResultUser;

SearchResultUser.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    userID: PropTypes.string.isRequired,
    userPic: PropTypes.string.isRequired
  }).isRequired
};
