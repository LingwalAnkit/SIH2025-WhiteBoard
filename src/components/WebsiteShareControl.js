import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { emitWebsiteShare } from '../socketConn/socketConn';
import { resetSharingState } from '../store/websiteSlice';

const WebsiteShareControl = ({ roomID, userID, isTeacher }) => {
  const dispatch = useDispatch();
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Use the isSharing state from Redux instead of local state
  const isSharing = useSelector((state) => state.website.isSharing);
  
  // Listen for changes to isSharing and reset the URL input when sharing is complete
  useEffect(() => {
    if (!isSharing && websiteUrl !== '') {
      setWebsiteUrl('');
    }
  }, [isSharing]);

  // Only teachers should be able to share websites
  if (!isTeacher) {
    return null;
  }

  const handleShare = () => {
    if (!websiteUrl) return;
    
    emitWebsiteShare({ websiteUrl, roomID, userID });
    // No need to set local state, Redux will handle it
  };

  const handleUrlChange = (e) => {
    setWebsiteUrl(e.target.value);
  };

  return (
    <div className="website-share-control">
      <input
        type="text"
        placeholder="Enter website URL to share"
        value={websiteUrl}
        onChange={handleUrlChange}
        className="website-url-input"
        disabled={isSharing}
      />
      <button 
        onClick={handleShare}
        disabled={!websiteUrl || isSharing}
        className="share-button"
      >
        {isSharing ? 'Sharing...' : 'Share Website'}
      </button>
    </div>
  );
};

export default WebsiteShareControl;