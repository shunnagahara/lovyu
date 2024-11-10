import React, { useState, useEffect } from 'react';
import { ReactComponent as MaleIcon } from './icons/male.svg'; // 男性アイコンのSVG
import { ReactComponent as FemaleIcon } from './icons/female.svg'; // 女性アイコンのSVG
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import './Modal.css';
import './Profile.css';

const personalityOptions = ["やさしい", "オラオラ", "しずか", "おもしろい"];
const ageRangeOptions = ["18 - 25", "25 - 30", "30 - 40", "40 - 50", "50 - 60"];

const Profile: React.FC = () => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [targetGender, setTargetGender] = useState('');
  const [favoriteAppearance, setFavoriteAppearance] = useState('');
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [favoriteAgeRange, setFavoriteAgeRange] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 男性・女性による「好きな外見」の選択肢
  const maleAppearanceOptions = ['爽やか系', 'ワイルド系', '韓国系'];
  const femaleAppearanceOptions = ['かわいい系', 'キレイ系', 'かわキレイ系'];

  const navigate = useNavigate();

  const validateInputs = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = '名前を入力してください。';
    if (!gender) newErrors.gender = '性別を選択してください。';
    if (!targetGender) newErrors.targetGender = '対象性別を選択してください。';
    if (gender && !favoriteAppearance) newErrors.favoriteAppearance = '好きな外見を選択してください。';
    if (!favoriteAgeRange) newErrors.favoriteAgeRange = '好きな年代を選択してください。';
    if (selectedPersonalities.length === 0) newErrors.selectedPersonalities = '好きな性格を選択してください。';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isUserDataComplete = () => {
    const storedUserData = localStorage.getItem('lovyu-user');
    if (storedUserData) {
      const { name, gender, targetGender, favoriteAppearance, selectedPersonalities, favoriteAgeRange } = JSON.parse(storedUserData);
      return name && gender && targetGender && favoriteAppearance && selectedPersonalities && favoriteAgeRange;
    }
    return false;
  };

  const handleNext = () => {
    if (validateInputs()) {
      const userData = { name, gender, targetGender, favoriteAppearance, selectedPersonalities, favoriteAgeRange };
      localStorage.setItem('lovyu-user', JSON.stringify(userData));
      navigate('/list');
    }
  };

  const togglePersonality = (personality: string) => {
    setSelectedPersonalities((prev) =>
      prev.includes(personality) ? prev.filter((p) => p !== personality) : [...prev, personality]
    );
  };

  useEffect(() => {
    if (isUserDataComplete()) {
      setShowModal(true); // Show modal if user data is complete
    }
  }, []);

  const handleModalClose = (navigateToChat: boolean) => {
    setShowModal(false);
    if (navigateToChat) {
      navigate('/list'); // Navigate to chat room list if user agrees
    }
  };

  return (
    <div className="profile-container">

      <Modal
        show={showModal}
        handleClose={() => handleModalClose(false)}
        title="プロフィールが保存されています"
        message="保存されたプロフィールでチャットルームに移動しますか？"
      >
        <button className="modal-button modal-button-confirm" onClick={() => handleModalClose(true)}>はい</button>
        <button className="modal-button modal-button-cancel" onClick={() => handleModalClose(false)}>いいえ</button>
      </Modal>

      <div className="profile-card">
        <h1>プロフィール登録</h1>

        <div className="profile-input-container">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="あなたの名前"
            className="profile-input"
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div className="profile-input-container">
          <div className="profile-input-title-div">
            <p>あなたの性別を選択:</p>
          </div>
          <div className="gender-selection">
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={() => setGender('male')}
                className="hidden-radio"
              />
              <MaleIcon className={`icon ${gender === 'male' ? 'selected' : ''}`} />
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={() => setGender('female')}
                className="hidden-radio"
              />
              <FemaleIcon className={`icon ${gender === 'female' ? 'selected' : ''}`} />
            </label>
          </div>
          {errors.gender && <p className="error-text">{errors.gender}</p>}
        </div>

        <div className="profile-input-container">
          <div className="profile-input-title-div">
            <p>対象の性別を選択:</p>
          </div>
          <div className="gender-selection">
            <label>
              <input
                type="radio"
                name="targetGender"
                value="male"
                checked={targetGender === 'male'}
                onChange={() => setTargetGender('male')}
                className="hidden-radio"
              />
              <MaleIcon className={`icon ${targetGender === 'male' ? 'selected' : ''}`} />
            </label>
            <label>
              <input
                type="radio"
                name="targetGender"
                value="female"
                checked={targetGender === 'female'}
                onChange={() => setTargetGender('female')}
                className="hidden-radio"
              />
              <FemaleIcon className={`icon ${targetGender === 'female' ? 'selected' : ''}`} />
            </label>
          </div>
          {errors.targetGender && <p className="error-text">{errors.targetGender}</p>}
        </div>

        <div className="profile-input-container">
          {targetGender && (
            <label className="profile-label">
              {/* 好きな外見: */}
              <div className="profile-input-title-div">
                <p>好きな外見を選択</p>
              </div>
              <select 
                className="profile-select" 
                value={favoriteAppearance} 
                onChange={(e) => setFavoriteAppearance(e.target.value)}
              >
                <option value="">選択してください</option>
                {(targetGender === 'male' ? maleAppearanceOptions : femaleAppearanceOptions).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.favoriteAppearance && <p className="error-text">{errors.favoriteAppearance}</p>}
            </label>
          )}

        </div>

        <div className="profile-input-container">
          <div className="personality-container">
            <div className="profile-input-title-div">
              <p>好きな性格を選択</p>
            </div>
            <div className="personality-options">
              {personalityOptions.map((personality) => (
                <div
                  key={personality}
                  className={`personality-tag ${selectedPersonalities.includes(personality) ? 'selected' : ''}`}
                  onClick={() => togglePersonality(personality)}
                >
                  {personality}
                </div>
              ))}
            </div>
            {errors.selectedPersonalities && <p className="error-text">{errors.selectedPersonalities}</p>}
          </div>
        </div>

        <div className="profile-input-container">
          <div className="personality-container">
            <div className="profile-input-title-div">
              <p>好きな年代を選択</p>
            </div>
            <label className="profile-label">
              <select
                className="profile-select"
                value={favoriteAgeRange}
                onChange={(e) => setFavoriteAgeRange(e.target.value)}
              >
                <option value="">選択してください</option>
                {ageRangeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.favoriteAgeRange && <p className="error-text">{errors.favoriteAgeRange}</p>}
            </label>
          </div>
        </div>

        <button onClick={handleNext} className="profile-button">次へ</button>
      </div>
    </div>
  );
};

export default Profile;
