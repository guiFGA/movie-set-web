"use client";

import styles from './Navbar.module.css'
import Link from 'next/link'
import {FaUser, FaSignOutAlt} from 'react-icons/fa'
import {useEffect, useState} from "react";
import { usePathname, useRouter } from 'next/navigation';

type UserRole = "CUSTOMER" | "ORGANIZER" | "GATE"
export default function Navbar(){

    const [logged, setLogged] = useState(false);
    const [role, setRole] = useState<UserRole | null>(null);
    const [name, setName] = useState<string | null>(null);

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        async function checkAuth(){
            try{
                const res = await fetch("/api/auth/status");
                const data = await res.json();

                if (res.ok && data.logged){
                    setLogged(true);
                    setRole(data.role);
                    setName(data.name);
                }else{
                    setLogged(false);
                    setRole(null);
                    setName(null);
                }
            }catch(error){
                console.error("Erro ao verificar autenticação:", error);
                setLogged(false);
                setRole(null);
                setName(null);
            }
        }
        
        checkAuth();
    }, [pathname]);

    async function handleLogout(){
        try{
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (!res.ok){
                console.error("Erro ao fazer logout");
                return;
            }
            setLogged(false);
        setRole(null);
        setName(null);

        router.push("/login");
        router.refresh();
        } catch (error) {
          console.error("Erro ao realizar logout:", error);
          }
    }

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
            {!logged ? (
                <Link href="/login" className={styles.login}><FaUser/></Link>
            ) : (
                <button onClick={handleLogout} className={styles.logout} title="Sair">
                    <FaUser /> <span>{name}</span>
                    <FaSignOutAlt className={styles.logoutIcon} />
                </button>
            )}    
        
            

        </nav>
    )


}
