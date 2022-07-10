import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { deleteObject, ref } from 'firebase/storage';
import { arrayRemove, deleteDoc, doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { deleteUser, signOut } from 'firebase/auth';
import { auth, database, storage } from '../Firebase/Firebase';
import SetupUserAccount from '../SetupUserAccount/SetupUserAccount';
import Home from '../Home/Home';
import Sidebar from '../Sidebar/Sidebar';
import ContextBar from '../ContextBar/ContextBar';
import FloatingMenu from '../FloatingMenu/FloatingMenu';
import NewPostModal from '../NewPostModal/NewPostModal';
import PostDetails from '../PostDetails/PostDetails';
import MyProfile from '../MyProfile/MyProfile.jsx';
import UserProfile from '../UserProfile/UserProfile';
import Bookmarks from '../Bookmarks/Bookmarks';
import Explore from '../Explore/Explore';
import SearchModal from '../SearchModal/SearchModal';
import Search from '../Search/Search';
import Trends from '../Trends/Trends';
import NewPostEffect from '../NewPostEffect/NewPostEffect';
import Mentions from '../Mentions/Mentions';
import WarningModal from '../WarningModal/WarningModal';
import './Main.css';

function Main({ userCredentials }) {
  const navigate = useNavigate();
  const { uid } = userCredentials;
  const [usr] = useDocumentData(doc(database, 'users', uid));
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isUserSetup, setIsUserSetup] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [postInfo, setPostInfo] = useState({});
  const [isPostBookmarked, setIsPostBookmarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostEffect, setNewPostEffect] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showContextbar, setShowContextbar] = useState(false);
  const [isReplyModalActive, setIsReplyModalActive] = useState(false);

  const logout = async () => {
    await signOut(auth);
  };

  const handleSetIsReplyModalActive = () => {
    setIsReplyModalActive(!isReplyModalActive);
  };

  const toggleContextbar = () => {
    setShowContextbar(!showContextbar);
  };

  const showNewPostEffect = () => {
    setNewPostEffect(true);
  };

  const showWarning = (message) => {
    setErrorMessage(message);
  };

  // save post info so it can be passed down to the contextbar
  const handlePostInfo = (post) => {
    setPostInfo(post);
  };

  const changeActiveTab = (mode) => {
    setActiveTab(mode);
  };

  const toggleNewPostModal = () => {
    setShowNewPostModal(!showNewPostModal);
    setShowSearchModal(false);
  };

  const toggleSearchModal = () => {
    setShowSearchModal(!showSearchModal);
    setShowNewPostModal(false);
  };

  const handleSearchQuery = (q) => {
    setSearchQuery(q.toLowerCase());
  };

  // is user isSetup, the CreateUserAccount component will not be shown
  const checkUserSetup = () => {
    if (usr.isSetup) {
      setIsUserSetup(true);
    }
  };

  const checkIsPostbookmarked = () => {
    if (usr.bookmarks.some((bookmark) => bookmark.postID === postInfo.post.postID)) {
      setIsPostBookmarked(true);
    } else {
      setIsPostBookmarked(false);
    }
  };

  // delete post from posts-collection and remove it from the user-object
  const deletePost = async (post) => {
    const docRef = doc(database, 'posts', post.postID);
    const userRef = doc(database, 'users', usr.userID);
    try {
      const handleDeleteDoc = async () => {
        await deleteDoc(docRef);
        if (post.image.imageRef !== null && post.isRepost === false) {
          const getImageRef = post.image.imageRef.split('appspot.com/').pop();
          const imageRef = ref(storage, getImageRef);
          await deleteObject(imageRef);
        }
      };

      const handleDeleteFromUserObject = async () => {
        // need to pass the exact object to delete into arrayRemove(), so we first need to retrieve the post-object from the user object.posts-array
        const userSnap = await getDoc(userRef);
        if (userSnap.data()) {
          const postToDelete = userSnap.data().posts.find((p) => p.postID === post.postID);
          await updateDoc(userRef, {
            posts: arrayRemove(postToDelete)
          });
        }
      };

      const handleRemoveHashtag = async (hashtagArray) => {
        hashtagArray.map(async (hashtag) => {
          const hashtagRef = doc(database, 'hashtags', hashtag.toLowerCase());
          try {
            await updateDoc(hashtagRef, {
              hashtag: hashtag.toLowerCase(),
              count: increment(-1)
            });
          } catch (err) {
            setErrorMessage(err);
          }

          const hashtagSnap = await getDoc(hashtagRef);
          if (hashtagSnap.data().count <= 0) {
            await deleteDoc(hashtagRef);
          }
        });
      };
      handleDeleteDoc();
      handleDeleteFromUserObject();
      if (post.hashtags.length > 0) {
        handleRemoveHashtag(post.hashtags);
      }

      navigate(-1);
    } catch (err) {
      setErrorMessage(err);
    }
  };

  const deleteAccount = async () => {
    const deletePosts = async () => {
      const IDArray = [];
      usr.posts.forEach((post) => {
        IDArray.push(post.postID);
      });
      IDArray.forEach(async (id) => {
        const docRef = doc(database, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const p = docSnap.data();
          deletePost(p);
        } else {
          setErrorMessage('no such document!');
        }
      });
    };

    const deleteUserAuthentication = async () => {
      const user = auth.currentUser;
      deleteUser(user)
        .then(() => {
          setErrorMessage('user deleted');
        })
        .catch((error) => {
          setErrorMessage(`an error occurred: ${error}`);
        });
    };

    const deleteUserInDatabase = async () => {
      await deleteDoc(doc(database, 'users', usr.userID));
      deleteUserAuthentication();
    };

    navigate('/login');
    await deletePosts();
    await deleteUserInDatabase();
  };

  useEffect(() => {
    if (usr) {
      checkUserSetup();
    }
  }, [usr]);

  useEffect(() => {
    if (postInfo.post) {
      checkIsPostbookmarked();
    }
  }, [postInfo]);

  useEffect(() => {
    if (newPostEffect) {
      setTimeout(() => setNewPostEffect(false), 2000);
    }
  }, [newPostEffect]);

  useEffect(() => {
    if (errorMessage) {
      setTimeout(() => setErrorMessage(null), 2000);
    }
  }, [errorMessage]);

  return (
    <div className="main-container">
      {isUserSetup && <Sidebar activeTab={activeTab} logout={logout} />}
      <Routes>
        <Route
          path="/"
          element={
            isUserSetup ? (
              <Home
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : (
              <SetupUserAccount userCredentials={userCredentials} />
            )
          }
        />
        {/* make nested route so UI elements like the sidebar don't have to be re-rendered on component change.  */}
        <Route
          path="home"
          element={
            isUserSetup ? (
              <Home
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : null
          }
        />
        <Route
          path="explore"
          element={
            isUserSetup ? (
              <Explore handleSearchQuery={handleSearchQuery} changeActiveTab={changeActiveTab} />
            ) : null
          }
        />
        <Route
          path="bookmarks"
          element={
            isUserSetup ? (
              <Bookmarks
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
              />
            ) : null
          }
        />
        <Route
          path="myprofile"
          element={
            isUserSetup ? (
              <MyProfile
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : null
          }
        />
        <Route
          path="userprofile/:id"
          element={
            isUserSetup ? (
              <UserProfile
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : null
          }
        />
        <Route
          path="search"
          element={
            isUserSetup ? (
              <Search
                searchQuery={searchQuery}
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : null
          }
        />
        <Route
          path="trends"
          element={
            isUserSetup ? (
              <Trends
                searchQuery={searchQuery}
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : null
          }
        />
        <Route
          path="mentions"
          element={
            isUserSetup ? (
              <Mentions
                changeActiveTab={changeActiveTab}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
                showWarning={showWarning}
              />
            ) : null
          }
        />

        <Route
          path="postDetails"
          element={
            isUserSetup ? (
              <PostDetails
                changeActiveTab={changeActiveTab}
                handlePostInfo={handlePostInfo}
                handleSetIsReplyModalActive={handleSetIsReplyModalActive}
              />
            ) : null
          }
        />
      </Routes>

      {isUserSetup && (
        <ContextBar
          activeTab={activeTab}
          postInfo={postInfo}
          deleteAccount={deleteAccount}
          deletePost={deletePost}
          isPostBookmarked={isPostBookmarked}
          showContextbar={showContextbar}
          toggleContextbar={toggleContextbar}
          logout={logout}
          showWarning={showWarning}
        />
      )}
      {isUserSetup && !showSearchModal && !showNewPostModal && !isReplyModalActive && (
        <FloatingMenu
          toggleNewPostModal={toggleNewPostModal}
          toggleSearchModal={toggleSearchModal}
          toggleContextbar={toggleContextbar}
          showContextbar={showContextbar}
        />
      )}
      {isUserSetup && showNewPostModal && (
        <NewPostModal
          toggleNewPostModal={toggleNewPostModal}
          showNewPostEffect={showNewPostEffect}
          showWarning={showWarning}
        />
      )}
      {isUserSetup && showSearchModal && (
        <SearchModal
          handleSearchQuery={handleSearchQuery}
          toggleSearchModal={toggleSearchModal}
          showWarning={showWarning}
        />
      )}
      {newPostEffect && <NewPostEffect />}
      {errorMessage && <WarningModal errorMessage={errorMessage} />}
    </div>
  );
}

export default Main;

Main.propTypes = {
  userCredentials: PropTypes.shape({
    uid: PropTypes.string.isRequired
  }).isRequired
};
