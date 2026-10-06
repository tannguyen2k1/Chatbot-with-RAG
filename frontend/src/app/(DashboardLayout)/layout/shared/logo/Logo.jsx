"use client";
import { useContext } from "react";
import { CustomizerContext } from "@/app/context/ClientCustomizerContext/customizerContext";
import config from "@/utils/config";
import { UTC_BRAND } from "@/utils/brand/utc";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Image from "next/image";

const Logo = () => {
  const { isCollapse, isSidebarHover } = useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;
  const mini = isCollapse == "mini-sidebar" && !isSidebarHover;

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width: mini ? "48px" : "200px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: mini ? "center" : "flex-start",
    textDecoration: "none",
  }));

  return (
    <LinkStyled href="/" aria-label={UTC_BRAND.short}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: mini ? 0 : 1,
          py: 1,
        }}
      >
        <Image
          src={mini ? UTC_BRAND.logos.emblem : UTC_BRAND.logos.full}
          alt={UTC_BRAND.nameVi}
          height={mini ? 40 : 44}
          width={mini ? 40 : 190}
          style={{ objectFit: "contain", width: "auto", height: mini ? 40 : 44 }}
          priority
        />
      </Box>
    </LinkStyled>
  );
};

export default Logo;
