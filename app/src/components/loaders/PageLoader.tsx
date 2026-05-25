'use client';
import styles from './PageLoader.module.css';
import { AI_LOGO } from '../../utils/img/assets';
type Props = {
  message?: string;   
};
export default function PageLoader({ message }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <div className={styles.center}>
        <div className={styles.logoWrap}>
          <img src={AI_LOGO} alt="Análisis" style={{width:'100%',height:'100%',objectFit:'contain'}} /> 
          <div className={styles.pulse} />
        </div>

        {/* Barra de progreso indeterminada */}
        <div className={styles.barTrack}>
          <div className={styles.barFill} />
        </div>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

