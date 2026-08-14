"use client";

import styles from './Navbar.module.css'
import Link from 'next/link'
import {FaUser} from 'react-icons/fa'
import {useEffect, useState} from "react";
import { usePathname } from 'next/navigation';

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE"
export default function Navbar(){

    const [logged, setLogged] = useState(false);
    const [role, setRole] = useState<UserRole | null>(null);

    const pathname = usePathname();

    useEffect(() => {
        async function checkAuth(){
            try{
                const res = await fetch("/api/auth/status");
                const data = await res.json();

                if (res.ok && data.logged){
                    setLogged(true);
                    setRole(data.role);
                    
                }else{
                    setLogged(false);
                    setRole(null);
                }
            }catch(error){
                console.error("Erro ao verificar autenticação:", error);
                setLogged(false);
                setRole(null);
            }
        }
        
        checkAuth();
    }, [pathname]);

    return(
        <nav className={styles.navbar}>
            <Link href="/" className={styles.logo}>
                <h1>Movie Set Web</h1>
            </Link>
            <ul className={styles.menu}>
                <li><Link href="/">Início</Link></li>
                {/*para o cliente*/}
                {role==="CUSTOMER" && (
                    <li><Link href="/meus-ingressos">Meus Ingressos</Link></li>)}
                {/*para todos*/}
                <li><Link href="/eventos-disponiveis">Eventos Disponíveis</Link></li>
                {/*para organizador*/}
                {role==="ORGANIZER" &&( 
                    <li><Link href="/criar-eventos">Criar eventos</Link></li>)}
                {role==="ORGANIZER" &&( 
                    <li><Link href="/meus-eventos">Meus eventos</Link></li>)}
                {/*para portaria*/}
                {role==="GATE" &&( 
                <li><Link href="/portaria">Portaria</Link></li>)}
                
            </ul>
            <Link href="/login" className={styles.login}><FaUser/></Link>
            

        </nav>
    )


}
