import React from 'react';
import IconButton from '../ui/icon-button';
import MoodDissatisfiedIcon from '../icons/mood-dissatisfied';
import MoodVeryDissatisfiedIcon from '../icons/mood-very-dissatisfied';
import MoodNeutralIcon from '../icons/mood-very-dissatisfied';
import MoodSatisfiedIcon from '../icons/mood-satisfied';
import MoodVerySatisfiedIcon from '../icons/mood-very-satisfied';

import "./mood.scss";

const moodConfig = {
    "Very dissatisfied": MoodVeryDissatisfiedIcon,
    "Dissatisfied": MoodDissatisfiedIcon,
    "Neutral": MoodNeutralIcon,
    "Satisfied": MoodSatisfiedIcon,
    "Very satisfied": MoodVerySatisfiedIcon,
};

export const Mood = ({ selectedMood, onClick }) => {
    return (
        <section className="mood-wrapper">
            {Object.entries(moodConfig).map(([moodName, MoodIcon]) => (
                <IconButton
                    key={moodName}
                    icon={MoodIcon}
                    className={moodName === selectedMood ? 'mood-icon--selected' : ''}
                    onClick={() => onClick(moodName)}
                />
            ))}
        </section>
    );
};