// src/pages/IdeaDetailPage.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { DiscussionDetail } from '../components/stack-suite/DiscussionDetail';

export const IdeaDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
            <DiscussionDetail 
                discussionId={id} 
                onBack={() => navigate('/validation-board')} 
            />
        </div>
    );
};
