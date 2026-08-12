import styles from './Navbar.module.css'
import Link from 'next/link'
import {FaUser} from 'react-icons/fa'

export default function Navbar(){

    return(
        <nav className={styles.navbar}>
            <Link href="/" className={styles.logo}>
                <h1>Movie Set Web</h1>
            </Link>
            <ul className={styles.menu}>
                <li><Link href="/">Início</Link></li>
                
                <li><Link href="/meus-ingressos">Meus Ingressos</Link></li>
                <li><Link href="/">Eventos Disponíveis</Link></li>
                <li><Link href="/criar-eventos">Criar eventos</Link></li>
                <li><Link href="/portaria">Portaria</Link></li>
                
            </ul>
            <Link href="/cadastro" className={styles.login}><FaUser/></Link>
            

        </nav>
    )


}
