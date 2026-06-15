'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  DeveloperProfile,
  DeveloperProjectCard,
  RelatedDeveloperCard,
} from '@/lib/api';
import { setWhatsAppPageContext, clearWhatsAppPageContext } from '@/lib/whatsAppPageState';
import styles from './DeveloperProfilePage.module.css';

function localizedPath(locale: string, path: string): string {
  return locale === 'en' ? path : `/${locale}${path}`;
}

function getProjectHref(locale: string, project: DeveloperProjectCard): string {
  if (project.path) {
    return localizedPath(locale, project.path);
  }

  if (project.url) {
    return project.url;
  }

  return localizedPath(locale, `/projects/${project.id}`);
}

function formatUpdatedAt(dateString?: string, locale: string = 'en'): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
  return locale === 'ru' ? `Обновлено: ${formatted}` : `Updated: ${formatted}`;
}

interface DeveloperProfilePageProps {
  locale: string;
  profile: DeveloperProfile;
  projects: DeveloperProjectCard[];
  relatedDevelopers: RelatedDeveloperCard[];
}

export default function DeveloperProfilePage({ locale, profile, projects, relatedDevelopers }: DeveloperProfilePageProps) {
  const isRu = locale === 'ru';
  const sectionRef = useRef<HTMLElement>(null);
  const faqSectionRef = useRef<HTMLDivElement>(null);
  const [lockSideBanners, setLockSideBanners] = useState(false);
  const [sideBannerStopTop, setSideBannerStopTop] = useState<number | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);
  const [hoveredChartIdx, setHoveredChartIdx] = useState<number | null>(null);

  const devName = isRu ? (profile.nameRu || profile.nameEn || profile.name) : (profile.nameEn || profile.name);
  const description = isRu
    ? (profile.descriptionRu || profile.description || '')
    : (profile.description || profile.descriptionRu || '');
  const avgPricesNarrative = isRu ? profile.avgPricesNarrativeRu : profile.avgPricesNarrative;
  const updatedLabel = formatUpdatedAt(profile.updatedAt, locale);
  const heroMainImage = profile.mainImage || projects.find((project) => project.image)?.image || null;

  const avgPriceChartRows = profile.avgPrices
    .map((row) => {
      const numericParts = String(row.price || '')
        .match(/\d[\d,]*/g)
        ?.map((part) => Number(part.replace(/,/g, '')))
        .filter((num) => Number.isFinite(num)) || [];

      if (!numericParts.length) return null;

      const min = Math.min(...numericParts);
      const max = Math.max(...numericParts);

      return {
        label: row.text,
        value: row.price,
        min,
        max,
        mid: (min + max) / 2,
      };
    })
    .filter((row): row is { label: string; value: string; min: number; max: number; mid: number } => Boolean(row));

  const rawChartMax = avgPriceChartRows.length ? Math.max(...avgPriceChartRows.map((row) => row.max)) : 0;
  const chartStep = 500000;
  const chartMax = rawChartMax > 0 ? Math.ceil(rawChartMax / chartStep) * chartStep : 0;
  const chartTicks = chartMax > 0
    ? [0, chartMax * 0.25, chartMax * 0.5, chartMax * 0.75, chartMax]
    : [];

  const svgWidth = 920;
  const svgHeight = 320;
  const chartPadding = { top: 20, right: 32, bottom: 70, left: 72 };
  const plotWidth = svgWidth - chartPadding.left - chartPadding.right;
  const plotHeight = svgHeight - chartPadding.top - chartPadding.bottom;

  const yToSvg = (value: number) => {
    if (chartMax <= 0) return chartPadding.top + plotHeight;
    return chartPadding.top + plotHeight - (value / chartMax) * plotHeight;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return chartPadding.left + plotWidth / 2;
    return chartPadding.left + (index * plotWidth) / (total - 1);
  };

  const trendPath = avgPriceChartRows
    .map((row, idx) => {
      const x = getX(idx, avgPriceChartRows.length);
      const y = yToSvg(row.mid);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const displayedProjects = profile.slug === 'emaar'
    ? projects.filter((p) => p.slug !== 'terra-woods')
    : projects;

  const whyInvest = profile.whyInvest?.length ? profile.whyInvest : profile.pros;

  const faqItems = profile.faqItems.map((item) => ({
    question: isRu ? (item.questionRu || item.question) : item.question,
    answer: isRu ? (item.answerRu || item.answer) : item.answer,
  }));

  useEffect(() => {
    setWhatsAppPageContext({ contextType: 'developer', contextName: devName });
    return () => clearWhatsAppPageContext();
  }, [devName]);

  useEffect(() => {
    setHeroImageError(false);
  }, [heroMainImage]);

  useEffect(() => {
    const update = () => {
      if (!sectionRef.current || !faqSectionRef.current) return;
      const sectionRect = sectionRef.current.getBoundingClientRect();
      const faqRect = faqSectionRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const sectionTopDoc = sectionRect.top + scrollY;
      const faqBottomDoc = faqRect.bottom + scrollY;
      const bannerHeight = 780;
      const fixedTop = 125;
      const stopOffset = 12;
      const stopTop = Math.max(0, faqBottomDoc - sectionTopDoc - bannerHeight - stopOffset);
      const shouldLock = scrollY + fixedTop >= faqBottomDoc - bannerHeight - stopOffset;
      setSideBannerStopTop(stopTop);
      setLockSideBanners(shouldLock);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section className={styles.developerDetail} ref={sectionRef}>

      <a
        href={localizedPath(locale, '/properties/property-ef1f2f9d')}
        className={`${styles.sideBannerLeft} ${lockSideBanners ? styles.sideBannerStopped : ''}`}
        style={lockSideBanners && sideBannerStopTop !== null ? { top: `${sideBannerStopTop}px` } : undefined}
      >
        <Image
          src="https://reelly-backend.s3.amazonaws.com/projects/3022/images/b0be582749704ccc8214e3b13cf2b326.webp"
          alt="Eywa Way of Water"
          fill
          className={styles.sideBannerImg}
          unoptimized
        />
        <div className={`${styles.sideBannerOverlay} ${styles.sideBannerOverlaySoft}`} />
        <div className={styles.sideBannerContentLeft}>
          <div className={styles.sideBannerIntro}>
            <p className={styles.sideBannerName}>Eywa Way of Water</p>
            <p className={styles.sideBannerLocation}>
              {isRu ? 'Расположен в Business Bay, Dubai' : 'Located in Business Bay, Dubai'}
            </p>
          </div>
          <div className={styles.sideBannerOfferBox}>
            <p className={styles.sideBannerOfferFrom}>from</p>
            <p className={styles.sideBannerPrice}>8,950,490 <span className={styles.sideBannerCurrency}>USD</span></p>
            <p className={styles.sideBannerBeds}>2 - 5 beds</p>
            <span className={styles.sideBannerCta}>Learn more</span>
          </div>
        </div>
      </a>

      <a
        href={localizedPath(locale, '/properties/property-ef1f2f9d')}
        className={`${styles.sideBannerRight} ${lockSideBanners ? styles.sideBannerStopped : ''}`}
        style={lockSideBanners && sideBannerStopTop !== null ? { top: `${sideBannerStopTop}px` } : undefined}
      >
        <Image
          src="https://reelly-backend.s3.amazonaws.com/projects/3022/images/246c691f250a4c10b68f3732541dbd1c.webp"
          alt="Eywa Way of Water"
          fill
          className={styles.sideBannerImg}
          unoptimized
        />
        <div className={styles.sideBannerOverlay} />
        <div className={styles.sideBannerIntro}>
          <p className={styles.sideBannerName}>Eywa Way of Water</p>
          <p className={styles.sideBannerLocation}>
            {isRu ? 'Расположен в Business Bay, Dubai' : 'Located in Business Bay, Dubai'}
          </p>
        </div>
        <div className={styles.sideBannerOfferBox}>
          <p className={styles.sideBannerOfferFrom}>from</p>
          <p className={styles.sideBannerPrice}>8,950,490 <span className={styles.sideBannerCurrency}>USD</span></p>
          <p className={styles.sideBannerBeds}>2 - 5 beds</p>
          <span className={styles.sideBannerCta}>Learn more</span>
        </div>
      </a>

      <div className={styles.container}>

        <div className={styles.heroSection}>
          <div className={styles.heroImageContainer}>
            <div className={styles.imageWrapper}>
              {heroMainImage && !heroImageError ? (
                <Image
                  src={heroMainImage}
                  alt={devName}
                  fill
                  className={styles.heroImage}
                  sizes="70vw"
                  unoptimized
                  onError={() => setHeroImageError(true)}
                />
              ) : (
                <div className={styles.heroPlaceholder} />
              )}
              <div className={styles.heroOverlay}>
                <div className={styles.heroContent}>
                  {profile.logo && (
                    <div className={styles.heroLogoWrap}>
                      <Image src={profile.logo} alt={devName} fill unoptimized style={{ objectFit: 'contain' }} />
                    </div>
                  )}
                  <h1 className={styles.heroTitle}>{devName}</h1>
                  <div className={styles.heroStats}>
                    <span className={styles.heroStat}>
                      {isRu ? 'Проектов' : 'Projects'}: <strong>{profile.projectsCount || projects.length}</strong>
                    </span>
                    {profile.areas.length > 0 && (
                      <span className={styles.heroStat}>
                        {isRu ? 'Районов' : 'Areas'}: <strong>{profile.areas.length}</strong>
                      </span>
                    )}
                  </div>
                  {profile.heroSummary && (
                    <p className={styles.heroSubtitle}>{profile.heroSummary}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {description && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'О девелопере' : 'About Developer'}
            </h2>
            <div className={styles.longText}>
              {description.split('\n\n').map((para, i) => (
                <p key={i} className={styles.descriptionText}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {whyInvest.length > 0 && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'Почему инвестировать' : 'Why Invest'}
            </h2>
            <ul className={styles.bulletList}>
              {whyInvest.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {profile.avgPrices.length > 0 && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'Средние цены' : 'Average Prices'}
            </h2>
            <div className={styles.priceCards}>
              {profile.avgPrices.map((row, i) => (
                <div key={i} className={styles.priceCard}>
                  <p className={styles.priceCardLabel}>{row.text}</p>
                  <p className={styles.priceCardValue}>{row.price}</p>
                  <p className={styles.priceCardCurrency}>AED</p>
                </div>
              ))}
            </div>
            {avgPriceChartRows.length > 0 && chartMax > 0 && (
              <div className={styles.priceChartWrap}>
                <div className={styles.priceChartSvgWrap}>
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={styles.priceChartSvg} role="img" aria-label="Developer price range chart" overflow="hidden">
                    <defs>
                      <clipPath id="devPriceClip">
                        <rect x={chartPadding.left} y={chartPadding.top} width={plotWidth} height={plotHeight + 1} />
                      </clipPath>
                    </defs>

                    <rect
                      x={chartPadding.left}
                      y={chartPadding.top}
                      width={plotWidth}
                      height={plotHeight}
                      className={styles.chartPlotBg}
                    />

                    {chartTicks.map((tick) => {
                      const y = yToSvg(tick);
                      return (
                        <g key={tick}>
                          <line x1={chartPadding.left} y1={y} x2={svgWidth - chartPadding.right} y2={y} className={styles.chartGridLine} />
                          <text x={chartPadding.left - 12} y={y + 4} textAnchor="end" className={styles.chartTickLabel}>
                            {`${Math.round(tick / 1000000)}M`}
                          </text>
                        </g>
                      );
                    })}

                    <line
                      x1={chartPadding.left}
                      y1={chartPadding.top}
                      x2={chartPadding.left}
                      y2={chartPadding.top + plotHeight}
                      className={styles.chartAxisLine}
                    />
                    <line
                      x1={chartPadding.left}
                      y1={chartPadding.top + plotHeight}
                      x2={svgWidth - chartPadding.right}
                      y2={chartPadding.top + plotHeight}
                      className={styles.chartAxisLine}
                    />

                    <g clipPath="url(#devPriceClip)">
                      {trendPath && <path d={trendPath} className={styles.chartTrendGlow} />}
                      {trendPath && <path d={trendPath} className={styles.chartTrendLine} />}

                      {avgPriceChartRows.map((row, idx) => {
                        const x = getX(idx, avgPriceChartRows.length);
                        const yMin = yToSvg(row.min);
                        const yMax = yToSvg(row.max);
                        const yMid = yToSvg(row.mid);
                        const q1 = yToSvg(row.min + (row.max - row.min) * 0.25);
                        const q3 = yToSvg(row.min + (row.max - row.min) * 0.75);
                        const fillWidth = 28;
                        return (
                          <g key={row.label}>
                            <rect
                              x={x - fillWidth / 2}
                              y={yMax}
                              width={fillWidth}
                              height={Math.max(2, yMin - yMax)}
                              rx={9}
                              className={styles.chartRangeFill}
                            />
                            <line x1={chartPadding.left} y1={q1} x2={svgWidth - chartPadding.right} y2={q1} className={styles.chartRangeDashed} />
                            <line x1={chartPadding.left} y1={q3} x2={svgWidth - chartPadding.right} y2={q3} className={styles.chartRangeDashed} />
                            <line x1={x} y1={yMin} x2={x} y2={yMax} className={styles.chartRangeLine} />
                            <circle cx={x} cy={yMin} r={4.5} className={styles.chartRangeDot} />
                            <circle cx={x} cy={yMax} r={4.5} className={styles.chartRangeDot} />
                            <circle cx={x} cy={yMid} r={5.5} className={styles.chartMidDot} />
                          </g>
                        );
                      })}
                    </g>

                    {avgPriceChartRows.map((row, idx) => {
                      const x = getX(idx, avgPriceChartRows.length);
                      return (
                        <g key={`label-${row.label}`}>
                          <rect
                            x={x - 40}
                            y={chartPadding.top}
                            width={80}
                            height={plotHeight}
                            fill="transparent"
                            style={{ cursor: 'crosshair' }}
                            onMouseEnter={() => setHoveredChartIdx(idx)}
                            onMouseLeave={() => setHoveredChartIdx(null)}
                          />
                          <text x={x} y={chartPadding.top + plotHeight + 26} textAnchor="middle" className={styles.chartXAxisLabel}>
                            {row.label}
                          </text>
                          <text x={x} y={chartPadding.top + plotHeight + 46} textAnchor="middle" className={styles.chartValueLabel}>
                            {row.value}
                          </text>
                        </g>
                      );
                    })}

                    {hoveredChartIdx !== null && (() => {
                      const hov = avgPriceChartRows[hoveredChartIdx];
                      const hx = getX(hoveredChartIdx, avgPriceChartRows.length);
                      const comparisons = avgPriceChartRows
                        .filter((_, i) => i !== hoveredChartIdx)
                        .map((other) => {
                          const pct = Math.round(((hov.mid - other.mid) / other.mid) * 100);
                          const sign = pct > 0 ? '+' : '';
                          return `${sign}${pct}% vs ${other.label}`;
                        });
                      const ttW = 250;
                      const lineH = 22;
                      const ttH = 32 + comparisons.length * lineH + 8;
                      let ttX = hx + 18;
                      if (ttX + ttW > svgWidth - chartPadding.right) ttX = hx - ttW - 18;
                      const ttY = chartPadding.top + 10;
                      return (
                        <g>
                          <rect x={ttX} y={ttY} width={ttW} height={ttH} rx={10} className={styles.chartTooltipBg} />
                          <text x={ttX + 14} y={ttY + 20} className={styles.chartTooltipTitle}>{hov.label}</text>
                          {comparisons.map((line, i) => (
                            <text key={i} x={ttX + 14} y={ttY + 20 + (i + 1) * lineH} className={styles.chartTooltipLine}>{line}</text>
                          ))}
                        </g>
                      );
                    })()}

                    <text x={16} y={chartPadding.top - 2} className={styles.chartUnitLabel}>AED</text>
                  </svg>
                </div>
              </div>
            )}
            {avgPricesNarrative && (
              <div className={styles.priceNarrative}>
                {avgPricesNarrative.split('\n\n').map((para, i) => (
                  <p key={i} className={styles.descriptionText}>{para}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {displayedProjects.length > 0 && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'Топ проекты' : 'Top Projects'}
            </h2>
            <div className={styles.projectsGrid}>
              {displayedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={getProjectHref(locale, project)}
                  className={styles.projectCard}
                >
                  <div className={styles.projectImageWrap}>
                    {project.image ? (
                      <Image src={project.image} alt={project.name} fill unoptimized className={styles.projectImg} />
                    ) : (
                      <div className={styles.projectImgPlaceholder} />
                    )}
                    <div className={styles.projectOverlay} />
                    <div className={styles.projectContent}>
                      <h3 className={styles.projectName}>{project.name}</h3>
                      <div className={styles.projectMeta}>
                        {project.location && <span>{project.location}</span>}
                        {project.priceFrom && <span>from {Number(String(project.priceFrom).replace(/[^0-9.]/g, '')).toLocaleString('en-US', { maximumFractionDigits: 0 })} AED</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {profile.areas.length > 0 && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'Районы присутствия' : 'Active Areas'}
            </h2>
            <div className={styles.areasGrid}>
              {profile.areas.map((area) => (
                <Link
                  key={area.slug}
                  href={localizedPath(locale, `/areas/${area.slug}`)}
                  className={styles.areaChip}
                >
                  {isRu ? (area.nameRu || area.nameEn || area.slug) : (area.nameEn || area.slug)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {(profile.pros.length > 0 || profile.cons.length > 0) && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'Плюсы и минусы' : 'Pros & Cons'}
            </h2>
            <div className={styles.prosConsGrid}>
              {profile.pros.length > 0 && (
                <div className={styles.prosBlock}>
                  <h3 className={styles.prosConsHeading}>
                    <span className={styles.prosIcon}>✓</span>
                    {isRu ? 'Плюсы' : 'Pros'}
                  </h3>
                  <ul className={styles.bulletList}>
                    {profile.pros.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.cons.length > 0 && (
                <div className={styles.consBlock}>
                  <h3 className={styles.prosConsHeading}>
                    <span className={styles.consIcon}>−</span>
                    {isRu ? 'Минусы' : 'Cons'}
                  </h3>
                  <ul className={styles.bulletList}>
                    {profile.cons.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {relatedDevelopers.length > 0 && (
          <div className={styles.contentSection}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'Похожие девелоперы' : 'Related Developers'}
            </h2>
            <div className={styles.relatedGrid}>
              {relatedDevelopers.map((dev) => (
                <Link
                  key={dev.id}
                  href={localizedPath(locale, `/developers/${dev.slug || dev.id}`)}
                  className={styles.relatedCard}
                >
                  {dev.logo && (
                    <span className={styles.relatedLogoWrap}>
                      <Image src={dev.logo} alt={dev.name} fill unoptimized />
                    </span>
                  )}
                  <span className={styles.relatedName}>{dev.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {faqItems.length > 0 && (
          <div className={styles.faqSection} ref={faqSectionRef}>
            <h2 className={styles.sectionTitle}>
              {isRu ? 'FAQ — Часто задаваемые вопросы' : 'FAQ — Frequently Asked Questions'}
            </h2>
            <p className={styles.faqIntro}>
              {isRu
                ? `Короткие ответы на самые частые вопросы о девелопере ${devName}, его проектах, ценах и инвестиционном потенциале.`
                : `Short answers to the most common questions about ${devName}, its projects, pricing, and investment potential.`}
            </p>
            <div className={styles.faqList}>
              {faqItems.map((item, i) => (
                <details key={i} className={styles.faqItem} {...(i === 0 ? { open: true } : {})}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {updatedLabel && <p className={styles.updated}>{updatedLabel}</p>}
      </div>
    </section>
  );
}
