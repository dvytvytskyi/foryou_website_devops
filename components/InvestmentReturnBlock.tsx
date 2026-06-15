"use client";

import React, { useState, useEffect } from 'react';
import styles from './InvestmentReturnBlock.module.css';
import { useLocale } from 'next-intl';

interface InvestmentReturnBlockProps {
  onRequestClick: () => void;
}

export default function InvestmentReturnBlock({ onRequestClick }: InvestmentReturnBlockProps) {
  const locale = useLocale();
  
  const [rentalYield, setRentalYield] = useState(6.2);
  const [capitalGrowth, setCapitalGrowth] = useState(5.0);
  const [holdingHorizon, setHoldingHorizon] = useState(5);

  
  
  
  
  
  
  const conservativeTotal = Math.round((rentalYield + capitalGrowth * 0.4) * holdingHorizon);
  const baseTotal = Math.round((rentalYield + capitalGrowth) * holdingHorizon);
  const optimisticTotal = Math.round((rentalYield + capitalGrowth * 1.6) * holdingHorizon);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.subtitle}>
          {locale === 'ru' ? 'ДОХОДНОСТЬ — ЧЕСТНО' : 'RETURN — HONESTLY'}
        </div>
        <h2 className={styles.title}>
          {locale === 'ru' ? (
            <>Что это может принести <span className={styles.italic}>за {holdingHorizon} лет</span></>
          ) : (
            <>What this could do <span className={styles.italic}>over {holdingHorizon} years</span></>
          )}
        </h2>
        <p className={styles.description}>
          {locale === 'ru'
            ? 'Никто не может гарантировать доход. Поэтому вместо одной цифры мы показываем диапазон — от консервативного до оптимистичного — и параметры, на которых он основан. Измените вводные данные по своему усмотрению.'
            : "No one can promise a return. So instead of a single number, here's the range we'd actually underwrite — conservative to optimistic — and exactly what each assumes. Move the inputs to your own view."}
        </p>
      </div>

      <div className={styles.controlsContainer}>
        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <div className={styles.controlLabel}>{locale === 'ru' ? <>Рентная<br/>доходность</> : <>Rental<br/>yield</>}</div>
            <div className={styles.controlValue}>{rentalYield.toFixed(1)}%</div>
          </div>
          <input 
            type="range" 
            min="2" max="10" step="0.1" 
            value={rentalYield} 
            onChange={(e) => setRentalYield(parseFloat(e.target.value))}
            className={styles.slider}
            style={{ background: `linear-gradient(to right, #2F6DC9 ${((rentalYield - 2) / 8) * 100}%, #e2e8f0 ${((rentalYield - 2) / 8) * 100}%)` }}
          />
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <div className={styles.controlLabel}>{locale === 'ru' ? <>Годовой<br/>рост капитала</> : <>Annual<br/>capital growth</>}</div>
            <div className={styles.controlValue}>{capitalGrowth.toFixed(1)}%</div>
          </div>
          <input 
            type="range" 
            min="0" max="15" step="0.1" 
            value={capitalGrowth} 
            onChange={(e) => setCapitalGrowth(parseFloat(e.target.value))}
            className={styles.slider}
            style={{ background: `linear-gradient(to right, #2F6DC9 ${((capitalGrowth - 0) / 15) * 100}%, #e2e8f0 ${((capitalGrowth - 0) / 15) * 100}%)` }}
          />
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <div className={styles.controlLabel}>{locale === 'ru' ? <>Горизонт<br/>удержания</> : <>Holding<br/>horizon</>}</div>
            <div className={styles.controlValue}>{holdingHorizon} {locale === 'ru' ? 'лет' : 'yr.'}</div>
          </div>
          <input 
            type="range" 
            min="1" max="15" step="1" 
            value={holdingHorizon} 
            onChange={(e) => setHoldingHorizon(parseInt(e.target.value))}
            className={styles.slider}
            style={{ background: `linear-gradient(to right, #2F6DC9 ${((holdingHorizon - 1) / 14) * 100}%, #e2e8f0 ${((holdingHorizon - 1) / 14) * 100}%)` }}
          />
        </div>
      </div>

      <div className={styles.cardsContainer}>
        
        <div className={`${styles.card} ${styles.cardActive}`}>
          <h3 className={styles.cardTitle}>{locale === 'ru' ? 'Консервативный' : 'Conservative'}</h3>
          <div className={styles.cardMainValue}>+{conservativeTotal - 5}–{conservativeTotal + 5}%</div>
          <div className={styles.cardSubText}>{locale === 'ru' ? `общая доходность за ${holdingHorizon} лет` : `total return over ${holdingHorizon} years`}</div>
          
          <div className={styles.divider}></div>
          
          <div className={styles.cardRow}>
            <div className={styles.rowLabel}>{locale === 'ru' ? <>Предполагаемый<br/>рост<br/>капитала</> : <>Capital<br/>growth<br/>assumed</>}</div>
            <div className={styles.rowValue}>~{(capitalGrowth * 0.4).toFixed(1)}%/yr</div>
          </div>
          <div className={styles.cardRow}>
            <div className={styles.rowLabel}>{locale === 'ru' ? 'Рентная доходность' : 'Rental yield'}</div>
            <div className={styles.rowValue}>{rentalYield.toFixed(1)}%</div>
          </div>
          <div className={styles.cardRow}>
            <div className={styles.rowLabel}>{locale === 'ru' ? <>Если рынок<br/>отстает</> : <>If the market<br/>underperforms</>}</div>
            <div className={styles.rowValue}>~{((capitalGrowth * 0.4 + rentalYield) * 0.7).toFixed(1)}%/yr</div>
          </div>
        </div>

        
        <div className={`${styles.card} ${styles.cardLocked}`}>
          <div className={styles.blurOverlay}>
            <button className={styles.requestButton} onClick={onRequestClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="3" y1="3" x2="21" y2="21"></line>
              </svg>
              {locale === 'ru' ? 'Запросить' : 'Request'}
            </button>
          </div>
          <div className={styles.blurredContent}>
            <h3 className={styles.cardTitle}>{locale === 'ru' ? 'Базовый' : 'Base case'}</h3>
            <div className={styles.cardMainValue}>+{baseTotal - 5}–{baseTotal + 5}%</div>
            <div className={styles.cardSubText}>{locale === 'ru' ? `общая доходность за ${holdingHorizon} лет` : `total return over ${holdingHorizon} years`}</div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.cardRow}>
              <div className={styles.rowLabel}>{locale === 'ru' ? <>Предполагаемый<br/>рост<br/>капитала</> : <>Capital<br/>growth<br/>assumed</>}</div>
              <div className={styles.rowValue}>~{capitalGrowth.toFixed(1)}%/yr</div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.rowLabel}>{locale === 'ru' ? 'Рентная доходность' : 'Rental yield'}</div>
              <div className={styles.rowValue}>{rentalYield.toFixed(1)}%</div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.rowLabel}>{locale === 'ru' ? <>Если рынок<br/>отстает</> : <>If the market<br/>underperforms</>}</div>
              <div className={styles.rowValue}>~{((capitalGrowth + rentalYield) * 0.7).toFixed(1)}%/yr</div>
            </div>
          </div>
        </div>

        
        <div className={`${styles.card} ${styles.cardLocked}`}>
          <div className={styles.blurOverlay}>
            <button className={styles.requestButton} onClick={onRequestClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="3" y1="3" x2="21" y2="21"></line>
              </svg>
              {locale === 'ru' ? 'Запросить' : 'Request'}
            </button>
          </div>
          <div className={styles.blurredContent}>
            <h3 className={styles.cardTitle}>{locale === 'ru' ? 'Оптимистичный' : 'Optimistic'}</h3>
            <div className={styles.cardMainValue}>+{optimisticTotal - 5}–{optimisticTotal + 5}%</div>
            <div className={styles.cardSubText}>{locale === 'ru' ? `общая доходность за ${holdingHorizon} лет` : `total return over ${holdingHorizon} years`}</div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.cardRow}>
              <div className={styles.rowLabel}>{locale === 'ru' ? <>Предполагаемый<br/>рост<br/>капитала</> : <>Capital<br/>growth<br/>assumed</>}</div>
              <div className={styles.rowValue}>~{(capitalGrowth * 1.6).toFixed(1)}%/yr</div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.rowLabel}>{locale === 'ru' ? 'Рентная доходность' : 'Rental yield'}</div>
              <div className={styles.rowValue}>{rentalYield.toFixed(1)}%</div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.rowLabel}>{locale === 'ru' ? <>Если рынок<br/>отстает</> : <>If the market<br/>underperforms</>}</div>
              <div className={styles.rowValue}>~{((capitalGrowth * 1.6 + rentalYield) * 0.7).toFixed(1)}%/yr</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
