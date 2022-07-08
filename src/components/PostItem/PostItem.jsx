import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './PostItem.css';
import uniqid from 'uniqid';
import { useNavigate } from 'react-router-dom';
import { BiMessageRounded, BiRepost, BiLike } from 'react-icons/bi';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import {
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayRemove
} from 'firebase/firestore';
import { format, fromUnixTime } from 'date-fns';
import { database } from '../Firebase/Firebase';
import Reply from '../Reply/Reply';
import parseText from '../../helpers/ParseText/ParseText';
import { GetUserContext } from '../../contexts/UserContext';

function PostItem({ postID, handleSetIsReplyModalActive }) {
  const { userData } = GetUserContext();
  const navigate = useNavigate();
  const [post] = useDocumentData(doc(database, 'posts', postID));
  const [postOwner, setPostOwner] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [clickEffect, setClickEffect] = useState({ reply: false, repost: false, like: false });
  const postDocRef = doc(database, 'posts', postID);
  const userDocRef = doc(database, 'users', userData.userID);

  // get username via getDoc rather than useDocumentData-hook to prevent exposing the whole user object to the front end
  const getOwner = async () => {
    try {
      const ownerDocRef = doc(database, 'users', post.ownerID);
      const docSnap = await getDoc(ownerDocRef);
      setPostOwner({
        username: docSnap.data().username,
        userpic: docSnap.data().userPic,
        ownerID: docSnap.data().userID
      });
    } catch (err) {
      console.log(err);
    }
  };

  const repost = async (ownerName, postContent, postImage) => {
    try {
      // copy userID to post document
      await updateDoc(postDocRef, {
        reposts: arrayUnion({ userID: userData.userID })
      });
      // copy postID to user document
      await updateDoc(userDocRef, {
        reposts: arrayUnion({ postID })
      });
      // create a new post in the user document with the repost as content
      const newPostID = uniqid();
      const repostContent = `reposting @${ownerName}:\n\n &laquo; ${postContent} &raquo;`;
      await setDoc(doc(database, 'posts', newPostID), {
        created: serverTimestamp(),
        postID: newPostID,
        ownerID: userData.userID,
        content: repostContent,
        hashtags: [],
        reposts: [],
        likes: [],
        replies: [],
        image: { imageURL: postImage.imageURL, imageRef: postImage.imageRef },
        isRepost: true
      });

      const addPostToUserObject = async (pID) => {
        const userRef = doc(database, 'users', userData.userID);
        const docRef = doc(database, 'posts', pID);
        const docSnap = await getDoc(docRef);

        await updateDoc(userRef, {
          posts: arrayUnion({ postID: pID, created: docSnap.data().created })
        });
      };

      addPostToUserObject(newPostID);
    } catch (err) {
      console.log(err);
    }
  };

  const like = async (pID) => {
    try {
      const docSnap = await getDoc(userDocRef);
      const found = pID;

      const likePost = async () => {
        await updateDoc(postDocRef, {
          likes: arrayUnion({ userID: userData.userID })
        });

        await updateDoc(userDocRef, {
          likes: arrayUnion({ postID })
        });
      };

      const unLikePost = async () => {
        await updateDoc(postDocRef, {
          likes: arrayRemove({ userID: userData.userID })
        });

        await updateDoc(userDocRef, {
          likes: arrayRemove({ postID })
        });
      };
      // like a post if not already liked or unlike if already liked
      if (docSnap.data().likes.some((item) => item.postID === found)) {
        unLikePost();
      } else {
        likePost();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // navigate to the PostDetails component and passing the postID and userID as state
  const linkToPostDetailsComponent = () => {
    navigate('/main/postDetails', { state: { postID, postOwner } });
  };

  const linkToUserProfile = (e) => {
    e.stopPropagation();
    navigate(`/main/userprofile/${postOwner.ownerID}`, {
      state: { usr: postOwner.ownerID }
    });
  };

  const toggleReplyModal = () => {
    setShowReplyModal(!showReplyModal);
    handleSetIsReplyModalActive(false);
  };

  useEffect(() => {
    if (post) {
      getOwner();
    }
  }, [post]);

  useEffect(() => {
    if (clickEffect) {
      setTimeout(() => setClickEffect({ reply: false, repost: false, like: false }), 200);
    }
  }, [clickEffect.reply || clickEffect.repost || clickEffect.like]);

  return (
    post && (
      <div
        className="post-container fadein"
        role="link"
        tabIndex={0}
        onClick={() => {
          linkToPostDetailsComponent();
        }}
        onKeyDown={() => {
          linkToPostDetailsComponent();
        }}>
        <div className="post-left-wrapper">
          <input
            type="image"
            className="post-usrpic"
            src={postOwner.userpic}
            alt="user avatar"
            tabIndex={0}
            onClick={(e) => {
              linkToUserProfile(e);
            }}
            onKeyDown={(e) => {
              linkToUserProfile(e);
            }}
          />
        </div>
        <div className="post-right-wrapper">
          <div className="post-userDetails">
            <div
              className="post-author"
              role="link"
              tabIndex={0}
              onClick={(e) => {
                linkToUserProfile(e);
              }}
              onKeyDown={(e) => {
                linkToUserProfile(e);
              }}>
              @{postOwner.username}
            </div>

            <div className="post-userDetails-separator">∙</div>
            <div className="post-date">{format(fromUnixTime(post.created.seconds), 'PPP')}</div>
          </div>
          <div className="post-content"> {parseText(post.content)}</div>
          {post.image.imageURL !== null && (
            <img className="post-image" src={post.image.imageURL} alt="uploaded content" />
          )}
          <div className="post-options">
            <div
              className={`optionItem ${clickEffect.reply ? 'clicked' : ''}`}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                toggleReplyModal();
                setClickEffect({ reply: true });
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                toggleReplyModal();
                setClickEffect({ reply: true });
                e.stopPropagation();
              }}>
              <BiMessageRounded size="1.5rem" />
              {post.replies.length}
            </div>
            <div
              className={`optionItem ${clickEffect.repost ? 'clicked' : ''}`}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                repost(postOwner.username, post.content, post.image);
                setClickEffect({ repost: true });

                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                repost(postOwner.username, post.content, post.image);
                setClickEffect({ repost: true });
                e.stopPropagation();
              }}>
              <BiRepost size="1.5rem" />
              {post.reposts.length}
            </div>
            <div
              className={`optionItem ${clickEffect.like ? 'clicked' : ''}`}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                like(postID);
                setClickEffect({ like: true });
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                like(postID);
                setClickEffect({ like: true });
                e.stopPropagation();
              }}>
              <BiLike size="1.5rem" />
              {post.likes.length}
            </div>
          </div>
        </div>
        {showReplyModal && (
          <Reply
            postID={postID}
            postOwner={postOwner}
            replyMode="modal"
            toggleReplyModal={toggleReplyModal}
          />
        )}
      </div>
    )
  );
}

export default PostItem;

PostItem.propTypes = {
  postID: PropTypes.string.isRequired,
  handleSetIsReplyModalActive: PropTypes.func.isRequired
};
