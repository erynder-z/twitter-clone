import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { BiMeh } from 'react-icons/bi';
import './Explore.css';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { database } from '../Firebase/Firebase';

function Explore({ handleSearchQuery, changeActiveTab }) {
  const navigate = useNavigate();
  const hashtagRef = collection(database, 'hashtags');
  const q = query(hashtagRef, orderBy('count', 'desc'), limit(25));
  const [trends] = useCollectionData(q);

  const handleClick = (hashtag) => {
    handleSearchQuery(hashtag);
    navigate('/main/trends');
  };

  useEffect(() => {
    changeActiveTab('explore');
  }, []);

  return (
    <div className="explore-container fadein">
      <div className="explore-header">Trending hashtags</div>
      <div className="explore-content">
        <div className="trends">
          {trends && trends.length <= 0 && (
            <div className="empty">
              <BiMeh size="3rem" />
              <h4> empty...</h4>
              <h5> trends will show up here</h5>
            </div>
          )}
          {trends &&
            trends.map((trend) => (
              <div
                key={trend.hashtag.toString()}
                className={`trend-item trend${trends.indexOf(trend)}`}
                role="link"
                tabIndex={0}
                onClick={() => {
                  handleClick(trend.hashtag);
                }}
                onKeyDown={() => {
                  handleClick(trend.hashtag);
                }}>
                {trends.indexOf(trend) < 10 && <span>{trends.indexOf(trend) + 1} </span>}
                {trends.indexOf(trend) === 10 && (
                  <div
                    className="other-trends"
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                    }}>
                    other trends:
                  </div>
                )}
                #{trend.hashtag}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Explore;

Explore.propTypes = {
  handleSearchQuery: PropTypes.func.isRequired,
  changeActiveTab: PropTypes.func.isRequired
};
