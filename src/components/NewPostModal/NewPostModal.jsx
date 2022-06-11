import React, { useState } from 'react';
import PropTypes from 'prop-types';
import uniqid from 'uniqid';
import { arrayUnion, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { database } from '../Firebase/Firebase';
import './NewPostModal.css';

function NewPostModal({ userCredentials, toggleModal }) {
  const { uid } = userCredentials;
  const [text, setText] = useState('');

  const addPostToUserObject = async (postID) => {
    const docRef = doc(database, 'users', uid);

    await updateDoc(docRef, {
      posts: arrayUnion({ postID })
    });
  };

  const submitPost = async () => {
    const postID = uniqid();
    await setDoc(doc(database, 'posts', postID), {
      created: serverTimestamp(),
      ownerID: uid,
      content: text,
      hasHashtag: false,
      hashtags: [],
      reposts: {
        numberOfReposts: 0,
        repostedUsers: []
      },
      likes: {
        numberOfLikes: 0,
        likedUsers: []
      },
      replies: {
        replyContent: '',
        repliedUserID: '',
        repliedUserName: ''
      }
    });

    addPostToUserObject(postID);
    toggleModal();
  };

  return (
    <div
      className="newPostModal-overlay"
      role="button"
      tabIndex={0}
      onClick={() => {
        toggleModal();
      }}
      onKeyDown={() => {
        toggleModal();
      }}>
      <div
        role="textbox"
        tabIndex={0}
        className="newPostModal-body"
        placeholder="enter text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}>
        <div
          className="close"
          role="button"
          tabIndex={0}
          onClick={() => {
            toggleModal();
          }}
          onKeyDown={() => {
            toggleModal();
          }}>
          &times;
        </div>
        <textarea name="newPost" id="newPost" cols="30" rows="10" />
        <button
          className="postBtn"
          type="submit"
          onClick={() => {
            submitPost();
          }}>
          Post
        </button>
      </div>
    </div>
  );
}

export default NewPostModal;

NewPostModal.propTypes = {
  toggleModal: PropTypes.func.isRequired,
  userCredentials: PropTypes.shape({
    uid: PropTypes.string.isRequired
  }).isRequired
};
