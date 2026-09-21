// ==========================================
// LAMPOON GIVEAWAY ROLE CLAIM BOT
// discord.js v14
// ==========================================

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const http = require("http");

// ==========================================
// CONFIGURATION
// ==========================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const GIVEAWAY_CHANNEL_ID = process.env.GIVEAWAY_CHANNEL_ID;
const GIVEAWAY_ROLE_ID = "1546589750549418044";

const PORT = Number(process.env.PORT) || 10000;

// ==========================================
// VALIDATION
// ==========================================

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing.");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("❌ CLIENT_ID is missing.");
  process.exit(1);
}

if (!GUILD_ID) {
  console.error("❌ GUILD_ID is missing.");
  process.exit(1);
}

if (!GIVEAWAY_CHANNEL_ID) {
  console.error("❌ GIVEAWAY_CHANNEL_ID is missing.");
  process.exit(1);
}

// ==========================================
// DISCORD CLIENT
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [
    Partials.GuildMember,
  ],
});

// ==========================================
// RENDER HEALTH CHECK
// ==========================================

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
    });

    return res.end("OK");
  }

  res.writeHead(200, {
    "Content-Type": "text/plain",
  });

  res.end("Giveaway Bot is online.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🌐 Giveaway Bot health server running on port ${PORT}`
  );
});

// ==========================================
// GIVEAWAY EMBED
// ==========================================

function createGiveawayEmbed() {
  return new EmbedBuilder()
    .setColor(0xC0C0C0)
    .setTitle("🎁 GIVEAWAY ROLE CLAIM")
    .setDescription(
      [
        "Congratulations to all eligible giveaway winners! 🎉",
        "",
        "If you are **claiming your giveaway reward**, click the **@Giveaways** button below to receive the Giveaway role.",
        "",
        "### 🎁 CLAIM YOUR REWARD",
        "",
        "Click **@Giveaways** to claim your temporary Giveaway role.",
        "",
        "After claiming the role, proceed with the designated giveaway ticket to complete your reward claim with the staff team.",
        "",
        "### ⚠️ IMPORTANT REMINDERS",
        "",
        "<a:Avisala:1542448826265243660> The **@Giveaways** role is only for members who are currently claiming a giveaway reward.",
        "<a:Avisala:1542448826265243660> Do **not** claim the role if you are not claiming a reward.",
        "<a:Avisala:1542448826265243660> Keep your reward claim and ticket private.",
        "<a:Avisala:1542448826265243660> Do not screenshot or expose the private ticket.",
        "<a:Avisala:1542448826265243660> Do not share the ticket contents or the sender's information.",
        "<a:Avisala:1542448826265243660> Follow the instructions provided by the staff team.",
        "<a:Avisala:1542448826265243660> When your giveaway ticket is closed, **Tickety Bot will remove the @Giveaways role**.",
        "",
        "🎁 **Ready to claim your reward?**",
        "",
        "Click **@Giveaways** below to claim your role."
      ].join("\n")
    )
    .setFooter({
      text: "LAMPOON • GIVEAWAY ROLE CLAIM",
    });
}

// ==========================================
// GIVEAWAY BUTTON
// ==========================================

function createGiveawayButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("claim_giveaways")
      .setLabel("@Giveaways")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Secondary)
  );
}

// ==========================================
// FIND / UPDATE GIVEAWAY PANEL
// ==========================================

async function setupGiveawayPanel() {
  try {
    const channel = await client.channels.fetch(
      GIVEAWAY_CHANNEL_ID
    );

    if (!channel || !channel.isTextBased()) {
      console.error(
        "❌ Giveaway channel could not be found or is not a text channel."
      );
      return;
    }

    const messages = await channel.messages.fetch({
      limit: 50,
    });

    const existingPanel = messages.find(
      (message) =>
        message.author.id === client.user.id &&
        message.components.some((row) =>
          row.components.some(
            (component) =>
              component.customId === "claim_giveaways"
          )
        )
    );

    const embed = createGiveawayEmbed();
    const row = createGiveawayButton();

    if (existingPanel) {
      await existingPanel.edit({
        embeds: [embed],
        components: [row],
      });

      console.log(
        `🎁 Giveaway claim panel updated in #${channel.name}`
      );
    } else {
      await channel.send({
        embeds: [embed],
        components: [row],
      });

      console.log(
        `🎁 Giveaway claim panel sent in #${channel.name}`
      );
    }
  } catch (error) {
    console.error(
      "❌ Failed to setup Giveaway claim panel:",
      error
    );
  }
}

// ==========================================
// BOT READY
// ==========================================

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`🎁 Giveaway Role ID: ${GIVEAWAY_ROLE_ID}`);
  console.log(
    `📢 Giveaway Channel ID: ${GIVEAWAY_CHANNEL_ID}`
  );

  await setupGiveawayPanel();
});

// ==========================================
// GIVEAWAY ROLE CLAIM
// ==========================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId !== "claim_giveaways") {
    return;
  }

  // Only work in the designated giveaway channel
  if (interaction.channelId !== GIVEAWAY_CHANNEL_ID) {
    return interaction.reply({
      content:
        "❌ The Giveaway role can only be claimed in the designated giveaway channel.",
      ephemeral: true,
    });
  }

  try {
    const member = interaction.member;

    if (!member) {
      return interaction.reply({
        content:
          "❌ I could not find your server membership.",
        ephemeral: true,
      });
    }

    // Check whether the member already has the role
    if (member.roles.cache.has(GIVEAWAY_ROLE_ID)) {
      return interaction.reply({
        content:
          "🎁 You already have the **@Giveaways** role. You can proceed with your reward claim.",
        ephemeral: true,
      });
    }

    // Add Giveaway role
    await member.roles.add(
      GIVEAWAY_ROLE_ID,
      "Giveaway reward claim"
    );

    await interaction.reply({
      content:
        "🎁 **Giveaway role claimed successfully!**\n\nYou now have the **@Giveaways** role and can proceed with your reward claim.",
      ephemeral: true,
    });

    console.log(
      `🎁 ${member.user.tag} claimed the Giveaway role.`
    );
  } catch (error) {
    console.error(
      "❌ Failed to assign Giveaway role:",
      error
    );

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          "❌ I couldn't assign the Giveaway role. Please contact the staff team.",
        ephemeral: true,
      });
    }
  }
});

// ==========================================
// LOGIN
// ==========================================

client.login(TOKEN);
