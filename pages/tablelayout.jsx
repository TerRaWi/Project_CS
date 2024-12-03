import React, { useState } from 'react';
import styles from '../styles/tablelayout.module.css';
import Addtable from '../components/Addtable';
import Deltable from '../components/Deltable';

const TableLayout = () => {
  const [showCard, setShowCard] = useState(false);
  const [cardType, setCardType] = useState(null);

  const handleOpenCard = (type) => {
    setCardType(type);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    setCardType(null);
  };

  return (
    <div>
      <h1 className={styles['heading-background']}>จัดการผังโต๊ะ</h1>
      <div className={styles['button-container']}>
        <button onClick={() => handleOpenCard('add')} className={styles['imageadd']}>
          <img src='/images/+.png' alt="ปุ่มเพิ่มโต๊ะ" />
        </button>
        <button onClick={() => handleOpenCard('delete')} className={styles['imagedel']}>
          <img src='/images/-.png' alt="ปุ่มลบโต๊ะ" />
        </button>
      </div>
      
      {showCard && (
        cardType === 'add' ? 
          <Addtable onClose={handleCloseCard} /> : 
          <Deltable onClose={handleCloseCard} />
      )}
    </div>
  );
};

export default TableLayout;
