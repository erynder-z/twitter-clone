import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PropTypes from 'prop-types';
import { format, fromUnixTime } from 'date-fns';
import { BiMeh } from 'react-icons/bi';
import './MyProfile.css';
import PostItem from '../PostItem/PostItem';
import { database } from '../Firebase/Firebase';
import { GetUserContext } from '../../contexts/UserContext';

function MyProfile({ changeActiveTab, handleSetIsReplyModalActive }) {
  const { userData } = GetUserContext();
  const {
    userPic,
    username,
    joined,
    following,
    followers,
    posts,
    description,
    replies,
    userID,
    likes
  } = userData;
  const [activeView, setActiveView] = useState('posts');
  const joinedDateFormatted = format(fromUnixTime(joined.seconds), 'dd LLLL yyy');
  const [postsAndReplies, setPostsAndReplies] = useState([]);
  const [media, setMedia] = useState([]);

  const sortPosts = (lst) => {
    const unsorted = [];
    lst.map((o) => unsorted.push({ postID: o.postID, created: o.created, userID }));
    const sorted = unsorted.sort((a, b) => (a.created.seconds < b.created.seconds ? 1 : -1));
    return sorted;
  };

  // get all of the users posts and posts the user has replied to
  const getPostsAndReplies = async () => {
    const list = [];
    const userReplies = [...replies];

    userReplies.forEach(async (reply) => {
      const q = query(collection(database, 'posts'), where('postID', '==', reply.postID));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        list.push({ postID: doc.data().postID, created: doc.data().created });
      });
      setPostsAndReplies(sortPosts(list));
    });
  };

  // get all of the users posts with an image
  const getMediaPosts = async () => {
    const list = [];
    const q = query(
      collection(database, 'posts'),
      where('ownerID', '==', userID),
      where('image.imageRef', '!=', 'null')
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      list.push({ postID: doc.data().postID, created: doc.data().created });
    });

    setMedia(sortPosts(list));
  };

  useEffect(() => {
    getPostsAndReplies();
  }, [activeView === 'postsAndReplies']);

  useEffect(() => {
    getMediaPosts();
  }, [activeView === 'media']);

  useEffect(() => {
    changeActiveTab('myprofile');
  }, []);

  // lists all the posts made by the user
  const Posts = (
    <div className="posts fadein">
      {posts && posts.length <= 0 && (
        <div className="empty">
          <BiMeh size="3rem" />
          <h4> empty...</h4>
          <h5> all your posts will show up here</h5>
        </div>
      )}
      {sortPosts(posts).map((post) => (
        <PostItem
          key={post.postID}
          postID={post.postID}
          userID={userData.userID}
          userPic={userData.userPic}
          handleSetIsReplyModalActive={handleSetIsReplyModalActive}
        />
      ))}
    </div>
  );

  const PostsAndReplies = (
    <div className="postsAndReplies fadein">
      {postsAndReplies && postsAndReplies.length <= 0 && (
        <div className="empty">
          <BiMeh size="3rem" />
          <h4> empty...</h4>
          <h5> all posts you replied to will show up here</h5>
        </div>
      )}
      {postsAndReplies.map((post) => (
        <PostItem
          key={postsAndReplies.indexOf(post)}
          postID={post.postID}
          userID={userData.userID}
          userPic={userData.userPic}
          handleSetIsReplyModalActive={handleSetIsReplyModalActive}
        />
      ))}
    </div>
  );

  const Media = (
    <div className="media fadein">
      {media && media.length <= 0 && (
        <div className="empty">
          <BiMeh size="3rem" />
          <h4> empty...</h4>
          <h5> all your posts with uploaded pictures will how up here</h5>
        </div>
      )}
      {media.map((post) => (
        <PostItem
          key={post.postID}
          postID={post.postID}
          userID={userData.userID}
          userPic={userData.userPic}
          handleSetIsReplyModalActive={handleSetIsReplyModalActive}
        />
      ))}
    </div>
  );

  const Likes = (
    <div className="likes fadein">
      {likes && likes.length <= 0 && (
        <div className="empty">
          <BiMeh size="3rem" />
          <h4> empty...</h4>
          <h5> all posts you liked will show up here</h5>
        </div>
      )}
      {likes.map((post) => (
        <PostItem
          key={post.postID}
          postID={post.postID}
          userID={userData.userID}
          userPic={userData.userPic}
          handleSetIsReplyModalActive={handleSetIsReplyModalActive}
        />
      ))}
    </div>
  );

  return (
    <div className="profile-container fadein">
      <div
        className="background-wrapper"
        style={{
          backgroundImage: `url(${userData.userBackground})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}>
        <div className="profile-header"> My Profile</div>

        <div className="profile-card">
          <div className="card-wrapper">
            <img className="profile-usrpic" src={userPic} alt="user avatar" />

            <div className="profile-userinfo-container">
              <h3 className="profile-username">@{username}</h3>
              <div className="profile-joined">joined {joinedDateFormatted}</div>
              <div className="profile-follow-container">
                <div className="profile-following">following: {following.length - 1}</div>
                <div className="profile-followers">followers: {followers.length}</div>
              </div>{' '}
            </div>
            <div className="profile-description">{description}</div>
          </div>
        </div>
      </div>
      <div className="profile-content">
        <div className="profile-content-header">
          <div
            className={`posts ${activeView === 'posts' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveView('posts');
            }}
            onKeyDown={() => {
              setActiveView('posts');
            }}>
            Posts
          </div>
          <div
            className={`postsAndReplies ${activeView === 'postsAndReplies' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveView('postsAndReplies');
            }}
            onKeyDown={() => {
              setActiveView('postsAndReplies');
            }}>
            Replies
          </div>
          <div
            className={`media ${activeView === 'media' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveView('media');
            }}
            onKeyDown={() => {
              setActiveView('media');
            }}>
            Media
          </div>
          <div
            className={`likes ${activeView === 'likes' ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveView('likes');
            }}
            onKeyDown={() => {
              setActiveView('likes');
            }}>
            Likes{' '}
          </div>
        </div>
        {activeView === 'posts' && Posts}
        {activeView === 'postsAndReplies' && PostsAndReplies}
        {activeView === 'media' && Media}
        {activeView === 'likes' && Likes}
      </div>
    </div>
  );
}

export default MyProfile;

MyProfile.propTypes = {
  changeActiveTab: PropTypes.func.isRequired,
  handleSetIsReplyModalActive: PropTypes.func.isRequired
};
