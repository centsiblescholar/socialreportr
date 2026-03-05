import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================
// TECH FINGERPRINTS (port of Python TECH_FINGERPRINTS)
// ============================================================
const TECH_FINGERPRINTS: Record<string, string[]> = {
  // Website Platforms — Major
  'Dealer.com': ['dealer.com/content', 'dealer.com/widget', 'ddc-site', 'dealerdotcom', 'ddc.'],
  'DealerOn': ['dealeron.com', 'dealeron_', 'DealerOn', 'searchnew.aspx', 'searchused.aspx', 'dealerRing'],
  'Dealer Inspire': ['dealerinspire.com', 'dealer-inspire', 'di-plugin', '/wp-content/themes/flavor/'],
  'DealerSocket': ['dealersocket.com', 'DealerSocket'],
  'Dealer Fire': ['dealerfire.com', 'DealerFire', 'engine6'],
  'Overfuel': ['overfuel.com', 'overfuel'],
  // Website Platforms — Mid-tier
  'Jazel': ['jazel.com', 'jazel-qa.com', 'jzla5p', 'jzlaq', 'jzl-core', 'jazelReady', 'jzl_tracking'],
  'DealerSync': ['dealersync.com', 'dealer-cdn.dealersync.com', 'images.dealersync.com'],
  'AutoRevo': ['autorevo.com', 'AutoRevo'],
  'Dealer Car Search': ['dealercarsearch.com'],
  'Naked Lime': ['nakedlime.com', 'nlmkt.com', 'WebMakerX', 'Aptus'],
  'Autofusion': ['autofusion.com', 'Autofusion'],
  'Search Optics': ['searchoptics.com', 'AutoWhyBuy'],
  'Carsforsale.com': ['carsforsale.com'],
  'izmocars': ['izmocars.com', 'goizmo.com', 'izmoAuto'],
  'V12 Software': ['v12software.com'],
  'ProMax': ['promaxunlimited.com', 'promaxauto.com'],
  'eBizAutos': ['ebizautos.com'],
  'Dealer Alchemist': ['dealeralchemist.com', 'dealervenom.com'],
  'NabThat': ['nabthat.com'],
  'TK Carsites': ['tkcarsites.com'],
  'Motive': ['motivehq.com'],
  // Website Platforms — Niche
  'SavvyDealer': ['savvydealer.com', 'savvy-dealer', 'SavvyDealer'],
  'Sincro': ['sincrodigital.com', 'sincro.'],
  'Dealer eProcess': ['dealereprocess.com', 'eProcess'],
  'fusionZone': ['fusionzone.com', 'fzautomotive'],
  'Fox Dealer': ['foxdealer.com', 'FoxDealer'],
  'AutoJini': ['autojini.com'],
  'AutoSweet': ['autosweet.com'],
  'DealerCenter': ['dealercenter.com', 'dealercenter.net'],
  'Speed Digital': ['speeddigital.com', 'Dealer Accelerate'],
  'Get My Auto': ['getmyauto.com'],
  'Remora': ['remora.com'],
  'FlexDealer': ['flexdealer.com'],
  'DealerWebsites.com': ['dealerwebsites.com'],
  'Spyne': ['spyne.ai'],
  'Dealer Spike': ['dealerspike.com', 'dealerspike.net'],
  'Dealer Teamwork': ['dealerteamwork.com', 'mpop'],
  'Digital Air Strike': ['digitalairstrike.com'],
  // DMS / CRM
  'CDK Global': ['cdkglobal.com', 'cdk.com', 'cdkconnect', 'fortellis.io'],
  'Reynolds & Reynolds': ['rfrk.com', 'reynoldsretailmanagement'],
  'Tekion': ['tekion.com', 'tekioncloud'],
  'VinSolutions': ['vinsolutions.com', 'VinSolutions', 'vinmanager'],
  'Elead CRM': ['eleadcrm.com', 'elead1one', 'Elead'],
  'DealerPeak': ['dealerpeak.com'],
  // Chat / Messaging
  'Podium': ['podium.com', 'podium-widget', 'webchat.podium'],
  'LivePerson': ['liveperson.net', 'LivePerson'],
  'Gubagoo': ['gubagoo.com', 'Gubagoo'],
  'ActivEngage': ['activengage.com', 'ActivEngage'],
  'CarChat24': ['carchat24.com'],
  'Kenect': ['kenect.com'],
  // Digital Retailing
  'GoMoto': ['gomoto.com'],
  'MakeMyDeal': ['makemydeal.com', 'MakeMyDeal'],
  'Accelerate (CDK)': ['cdk-modern-retail', 'accelerate-my-deal'],
  // Marketing
  'Google Analytics 4': ['gtag/js', 'google-analytics.com/g/'],
  'Google Analytics (UA)': ['UA-', 'google-analytics.com/analytics.js'],
  'Google Tag Manager': ['googletagmanager.com', 'GTM-'],
  'Facebook Pixel': ['facebook.com/tr', 'fbevents.js', 'fbq('],
  'Google Ads': ['googleads.g.doubleclick', 'adservice.google'],
  'Bing Ads': ['bat.bing.com', 'UET'],
  'Lotlinx': ['lotlinx.com'],
  'PureCars': ['purecars.com'],
  'Netsertive': ['netsertive.com'],
  'Fullpath': ['fullpath.com', 'autoleadstar.com'],
  'Shift Digital': ['shiftdigital.com'],
  // Inventory
  'HomeNet': ['homenetauto.com'],
  'vAuto': ['vauto.com', 'vAuto'],
  'CarGurus': ['cargurus.com/widgets'],
  'TrueCar': ['truecar.com', 'TrueCar'],
  // Trade-In
  'KBB ICO': ['kbb.com/ico', 'InstantCashOffer', 'kbb-ico', 'buyersguide.kbb.com', 'kbb.com/instant-cash-offer'],
  'TradePending': ['tradepending.com', 'trade.tradepending.com', 'tp-widget', 'tradepending-widget'],
  'CarOffer': ['caroffer.com'],
  'Kelley Blue Book': ['kbb.com/trade-in', 'kbb.com/cash-offer'],
  // Scheduling
  'Xtime': ['xtime.com', 'Xtime', 'scheduler.xtime.com', 'xtime.com/scheduling', 'xtimescheduler'],
  'DealerSocket Service': ['myscheduling.com', 'service-scheduling.dealersocket'],
  // Digital Retailing (subpage-specific fingerprints)
  'Roadster': ['roadster.com', 'Express Storefront', 'expressway.roadster.com', 'roadster-widget', 'roadster.com/express'],
  'AutoFi': ['autofi.com', 'AutoFi', 'autofi-widget', 'autofi.com/plugin'],
  // Finance tools (subpage-specific)
  'RouteOne': ['routeone.com', 'RouteOne'],
  'DealerTrack': ['dealertrack.com', 'DealerTrack'],
  '700Credit': ['700credit.com', '700Credit'],
  // Search / Inventory Infrastructure
  'Typesense': ['typesense.net', 'typesense-instantsearch', 'typesenseApiKey'],
  // Security / CDN
  'Cloudflare': ['cf-browser-verification', 'cloudflare', 'cf-ray', '__cf_bm', 'cf_clearance'],
}

const CATEGORY_MAP: Record<string, string> = {
  // Website Platforms — Major
  'Dealer.com': 'website_platform', 'DealerOn': 'website_platform', 'Dealer Inspire': 'website_platform',
  'DealerSocket': 'website_platform', 'Dealer Fire': 'website_platform', 'Overfuel': 'website_platform',
  // Website Platforms — Mid-tier
  'Jazel': 'website_platform', 'DealerSync': 'website_platform', 'AutoRevo': 'website_platform',
  'Dealer Car Search': 'website_platform', 'Naked Lime': 'website_platform', 'Autofusion': 'website_platform',
  'Search Optics': 'website_platform', 'Carsforsale.com': 'website_platform', 'izmocars': 'website_platform',
  'V12 Software': 'website_platform', 'ProMax': 'website_platform', 'eBizAutos': 'website_platform',
  'Dealer Alchemist': 'website_platform', 'NabThat': 'website_platform', 'TK Carsites': 'website_platform',
  'Motive': 'website_platform',
  // Website Platforms — Niche
  'SavvyDealer': 'website_platform', 'Sincro': 'website_platform', 'Dealer eProcess': 'website_platform',
  'fusionZone': 'website_platform', 'Fox Dealer': 'website_platform', 'AutoJini': 'website_platform',
  'AutoSweet': 'website_platform', 'DealerCenter': 'website_platform', 'Speed Digital': 'website_platform',
  'Get My Auto': 'website_platform', 'Remora': 'website_platform', 'FlexDealer': 'website_platform',
  'DealerWebsites.com': 'website_platform', 'Spyne': 'website_platform', 'Dealer Spike': 'website_platform',
  'Dealer Teamwork': 'website_platform', 'Digital Air Strike': 'website_platform',
  // DMS / CRM
  'CDK Global': 'dms_crm', 'Reynolds & Reynolds': 'dms_crm', 'Tekion': 'dms_crm',
  'VinSolutions': 'dms_crm', 'Elead CRM': 'dms_crm', 'DealerPeak': 'dms_crm',
  // Chat / Messaging
  'Podium': 'chat_messaging', 'LivePerson': 'chat_messaging', 'Gubagoo': 'chat_messaging',
  'ActivEngage': 'chat_messaging', 'CarChat24': 'chat_messaging', 'Kenect': 'chat_messaging',
  // Digital Retailing
  'Roadster': 'digital_retailing', 'AutoFi': 'digital_retailing', 'GoMoto': 'digital_retailing',
  'MakeMyDeal': 'digital_retailing', 'Accelerate (CDK)': 'digital_retailing',
  // Marketing
  'Google Analytics 4': 'marketing_retargeting', 'Google Analytics (UA)': 'marketing_retargeting',
  'Google Tag Manager': 'marketing_retargeting', 'Facebook Pixel': 'marketing_retargeting',
  'Google Ads': 'marketing_retargeting', 'Bing Ads': 'marketing_retargeting',
  'Lotlinx': 'marketing_retargeting', 'PureCars': 'marketing_retargeting',
  'Netsertive': 'marketing_retargeting', 'Fullpath': 'marketing_retargeting',
  'Shift Digital': 'marketing_retargeting',
  // Inventory
  'HomeNet': 'inventory_tools', 'vAuto': 'inventory_tools', 'CarGurus': 'inventory_tools', 'TrueCar': 'inventory_tools',
  // Trade-In
  'KBB ICO': 'trade_in_tools', 'TradePending': 'trade_in_tools', 'CarOffer': 'trade_in_tools',
  'Kelley Blue Book': 'trade_in_tools',
  // Scheduling
  'Xtime': 'scheduling', 'DealerSocket Service': 'scheduling',
  // Finance
  'RouteOne': 'dms_crm', 'DealerTrack': 'dms_crm', '700Credit': 'dms_crm',
  // Search / Inventory Infrastructure
  'Typesense': 'inventory_tools',
  // Security / CDN
  'Cloudflare': 'security',
}

const OEM_BRANDS = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Chevy', 'Nissan', 'Hyundai', 'Kia',
  'Jeep', 'Ram', 'Dodge', 'Chrysler', 'GMC', 'Buick', 'Cadillac', 'BMW',
  'Mercedes-Benz', 'Audi', 'Volkswagen', 'Subaru', 'Mazda', 'Lexus', 'Acura',
  'Infiniti', 'Volvo', 'Lincoln', 'Genesis', 'Mitsubishi', 'Land Rover',
  'Jaguar', 'Porsche', 'MINI', 'Tesla', 'Rivian',
]

// ============================================================
// HELPERS
// ============================================================

const SCRAPE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function buildBrowserHeaders(url: string): Record<string, string> {
  let origin: string
  try { origin = new URL(url).origin } catch { origin = '' }
  return {
    'User-Agent': SCRAPE_UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    ...(origin ? { 'Referer': origin + '/' } : {}),
  }
}

function detectCloudflareBlock(html: string, status: number): string | null {
  if (status === 403 || status === 503) {
    if (html.includes('cf-browser-verification') || html.includes('cf_chl_opt'))
      return 'Cloudflare JS Challenge'
    if (html.includes('cf-turnstile') || html.includes('challenges.cloudflare.com'))
      return 'Cloudflare Turnstile CAPTCHA'
    if (html.includes('cf-error-details') || html.includes('Attention Required'))
      return 'Cloudflare WAF Block'
  }
  if (status === 429) return 'Rate Limited (429)'
  if (html.includes('cf-browser-verification') && html.length < 10000)
    return 'Cloudflare JS Challenge (soft)'
  return null
}

function parsePrice(val: string | number): number {
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

function extractJsonLd(html: string): any[] {
  const results: any[] = []
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      if (Array.isArray(parsed)) results.push(...parsed)
      else results.push(parsed)
    } catch { /* ignore */ }
  }
  return results
}

// ============================================================
// SUBPAGE DISCOVERY & FETCHING
// ============================================================

/** Category patterns for subpage discovery — ordered by specificity */
const SUBPAGE_PATTERNS: Record<string, { patterns: string[]; fallbacks: string[] }> = {
  service: {
    patterns: ['schedule-service', 'service-appointment', 'service-department', 'service-center', '/service/', 'service-and-parts', 'book-service', 'service-scheduling', 'schedule-appointment'],
    fallbacks: ['/schedule-service/', '/service-appointment.html', '/service/'],
  },
  trade_in: {
    patterns: ['value-your-trade', 'trade-in', 'trade-appraisal', 'kbb-instant-cash-offer', 'tradepending', 'instant-cash-offer', 'sell-your-car'],
    fallbacks: ['/value-your-trade/', '/trade-in/'],
  },
  finance: {
    patterns: ['get-pre-approved', 'credit-application', '/finance/', 'financing', 'apply-for-financing', 'payment-calculator'],
    fallbacks: ['/finance/', '/get-pre-approved/'],
  },
  parts: {
    patterns: ['order-parts', '/parts/', 'parts-department', 'parts-center'],
    fallbacks: ['/parts/'],
  },
}

/** Discover subpage URLs from homepage links */
function discoverSubpageUrls(baseUrl: string, html: string): string[] {
  const discovered: string[] = []
  const hostname = new URL(baseUrl).hostname

  // Extract all hrefs
  const hrefRegex = /href=["']([^"'#]+)["']/gi
  const allHrefs: string[] = []
  let m
  while ((m = hrefRegex.exec(html)) !== null) {
    try {
      const resolved = new URL(m[1], baseUrl).href
      if (new URL(resolved).hostname === hostname) allHrefs.push(resolved)
    } catch { /* skip invalid */ }
  }

  // For each category, find best matching link or use fallback
  for (const [_category, { patterns, fallbacks }] of Object.entries(SUBPAGE_PATTERNS)) {
    let found = false
    for (const pattern of patterns) {
      const match = allHrefs.find(h => h.toLowerCase().includes(pattern))
      if (match && !discovered.includes(match)) {
        discovered.push(match)
        found = true
        break
      }
    }
    if (!found) {
      // Use first fallback path
      discovered.push(baseUrl.replace(/\/$/, '') + fallbacks[0])
    }
  }

  // Try to find a sample VDP (vehicle detail page) for digital retailing detection
  const vdpPatterns = ['/inventory/', '/vehicle/', '/vin/', '/detail/']
  const vdpLink = allHrefs.find(h => {
    const path = new URL(h).pathname
    return vdpPatterns.some(p => path.includes(p)) && path.split('/').filter(Boolean).length >= 3
  })
  if (vdpLink && !discovered.includes(vdpLink)) discovered.push(vdpLink)

  return discovered
}

/** Fetch multiple subpages in parallel, return concatenated HTML */
async function fetchSubpages(urls: string[]): Promise<string> {
  console.log(`[subpages] Fetching ${urls.length} subpages...`)
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const resp = await fetch(url, {
          headers: buildBrowserHeaders(url),
          signal: AbortSignal.timeout(10000),
        })
        if (!resp.ok) return ''
        const html = await resp.text()
        // Skip soft-404s (very short responses or likely error pages)
        if (html.length < 2000) return ''
        console.log(`[subpages] Got ${url} (${Math.round(html.length / 1024)}KB)`)
        return html
      } catch {
        console.log(`[subpages] Failed: ${url}`)
        return ''
      }
    })
  )
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(h => h.length > 0)
    .join('\n')
}

/** Extract Typesense connection config from homepage JavaScript (Dealer Venom / Alchemist sites) */
function extractTypesenseConfig(html: string): { host: string; apiKey: string; collection: string } | null {
  // Look for Typesense host pattern (e.g., hjnrb3s21408ezpfp.a1.typesense.net)
  const hostMatch = html.match(/["']([a-z0-9]+\.a1\.typesense\.net)["']/i)
    || html.match(/["']([a-z0-9-]+\.typesense\.net)["']/i)
  if (!hostMatch) return null

  // Extract API key — typically near "apiKey" or "api_key" in JS config
  const apiKeyMatch = html.match(/(?:apiKey|api_key|typesenseApiKey)\s*[:=]\s*["']([a-zA-Z0-9]{20,})["']/i)
  if (!apiKeyMatch) return null

  // Extract collection name — typically "vehicles-XXXXX" pattern
  const collectionMatch = html.match(/["'](vehicles-[A-Z0-9]+)["']/i)
    || html.match(/collection(?:Name)?\s*[:=]\s*["']([^"']+)["']/i)
  if (!collectionMatch) return null

  console.log(`[typesense] Found config: host=${hostMatch[1]}, collection=${collectionMatch[1]}`)
  return { host: hostMatch[1], apiKey: apiKeyMatch[1], collection: collectionMatch[1] }
}

/** Query Typesense search API for inventory counts and vehicle data */
async function fetchTypesenseInventory(
  config: { host: string; apiKey: string; collection: string }
): Promise<{ inventory: Record<string, any>; srpHtml: string } | null> {
  try {
    const params = new URLSearchParams({
      q: '*',
      query_by: 'make,model',
      per_page: '250',
      facet_by: 'condition,make,model,year',
      'x-typesense-api-key': config.apiKey,
    })
    const resp = await fetch(
      `https://${config.host}/collections/${config.collection}/documents/search?${params}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!resp.ok) {
      console.log(`[typesense] API returned ${resp.status}`)
      return null
    }
    const data = await resp.json()

    const inventory = buildEmptyInventory()

    // Parse facet counts for condition (new/used)
    const condFacet = data.facet_counts?.find((f: any) => f.field_name === 'condition')
    for (const val of condFacet?.counts || []) {
      const label = String(val.value).toLowerCase()
      if (label === 'new') inventory.new_count = val.count
      else if (label === 'used' || label === 'pre-owned') inventory.used_count = val.count
      else if (label === 'certified') inventory.certified_count = val.count
    }

    // Parse facet counts for make
    const makeFacet = data.facet_counts?.find((f: any) => f.field_name === 'make')
    for (const val of makeFacet?.counts || []) {
      inventory.makes[val.value] = val.count
    }

    // Parse facet counts for model
    const modelFacet = data.facet_counts?.find((f: any) => f.field_name === 'model')
    for (const val of modelFacet?.counts || []) {
      inventory.models[val.value] = val.count
    }

    // Parse facet counts for year
    const yearFacet = data.facet_counts?.find((f: any) => f.field_name === 'year')
    for (const val of yearFacet?.counts || []) {
      inventory.years[String(val.value)] = val.count
    }

    // Use found total or sum of conditions
    inventory.total_count = data.found || (inventory.new_count + inventory.used_count + inventory.certified_count)

    // Extract sample vehicles from hits
    for (const hit of (data.hits || []).slice(0, 100)) {
      const doc = hit.document || {}
      addVehicleToInventory(inventory, {
        year: doc.year || '',
        make: doc.make || '',
        model: doc.model || '',
        vin: doc.vin || '',
        price: parsePrice(doc.price || doc.our_price || doc.msrp || 0),
        condition: String(doc.condition || '').toLowerCase().includes('new') ? 'new' : 'used',
      })
    }

    calcInventoryAverages(inventory)
    console.log(`[typesense] Found ${inventory.total_count} vehicles (${inventory.new_count} new, ${inventory.used_count} used)`)
    if (inventory.total_count > 0) return { inventory, srpHtml: '' }
    return null
  } catch (err) {
    console.log(`[typesense] Error: ${err}`)
    return null
  }
}

/** Parse static inventory counts from homepage text (universal last-resort fallback) */
function parseHomepageInventoryCounts(html: string): { new_count: number; used_count: number } {
  let newCount = 0, usedCount = 0

  // Strip HTML tags for text-based matching
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  // Pattern: "294 New Vehicles" / "136 Used Vehicles"
  const newMatch = text.match(/(\d{1,4})\s+new\s+(?:vehicles?|cars?|inventory)/i)
  if (newMatch) newCount = parseInt(newMatch[1]) || 0

  const usedMatch = text.match(/(\d{1,4})\s+(?:used|pre-owned|certified)\s+(?:vehicles?|cars?|inventory)/i)
  if (usedMatch) usedCount = parseInt(usedMatch[1]) || 0

  // Pattern: "New Vehicles (294)" / "New Inventory: 136"
  if (!newCount) {
    const m = text.match(/new\s+(?:vehicles?|cars?|inventory)\s*[:(]\s*(\d{1,4})/i)
    if (m) newCount = parseInt(m[1]) || 0
  }
  if (!usedCount) {
    const m = text.match(/(?:used|pre-owned)\s+(?:vehicles?|cars?|inventory)\s*[:(]\s*(\d{1,4})/i)
    if (m) usedCount = parseInt(m[1]) || 0
  }

  // Sanity: ignore counts > 3000 (likely false positive)
  if (newCount > 3000) newCount = 0
  if (usedCount > 3000) usedCount = 0

  return { new_count: newCount, used_count: usedCount }
}

/** Detect the dealer website platform from homepage HTML */
function detectPlatform(html: string, _url: string): string | null {
  const h = html.toLowerCase()
  // Tier 1: Platforms with confirmed working APIs
  if (h.includes('dealer.com/content') || h.includes('ddc-site') || h.includes('dealerdotcom') || h.includes('ddc.'))
    return 'dealer_com'
  if (h.includes('dealeron.com') || h.includes('dealeron_') || h.includes('dealeron_tagging_data') || h.includes('searchnew.aspx') || h.includes('searchused.aspx'))
    return 'dealeron'
  // Tier 2: Major platforms — enhanced SRP fallback
  if (h.includes('dealerinspire.com') || h.includes('dealer-inspire') || h.includes('di-plugin') || h.includes('/wp-content/themes/flavor/'))
    return 'dealer_inspire'
  if (h.includes('dealersocket.com') || h.includes('dealersocket'))
    return 'dealersocket'
  if (h.includes('dealerfire.com') || h.includes('dealerfire') || h.includes('engine6'))
    return 'dealer_fire'
  if (h.includes('overfuel.com') || h.includes('overfuel'))
    return 'overfuel'
  // Tier 3: Mid-tier platforms
  if (h.includes('jazel.com') || h.includes('jazel-qa.com') || h.includes('jzla5p') || h.includes('jzlaq') || h.includes('jzl-core') || h.includes('jazelready'))
    return 'jazel'
  if (h.includes('dealersync.com') || h.includes('dealer-cdn.dealersync'))
    return 'dealersync'
  if (h.includes('autorevo.com'))
    return 'autorevo'
  if (h.includes('dealercarsearch.com'))
    return 'dealer_car_search'
  if (h.includes('nakedlime.com') || h.includes('nlmkt.com') || h.includes('webmakerx') || h.includes('aptus'))
    return 'naked_lime'
  if (h.includes('autofusion.com'))
    return 'autofusion'
  if (h.includes('searchoptics.com') || h.includes('autowhybuy'))
    return 'search_optics'
  if (h.includes('carsforsale.com'))
    return 'carsforsale'
  if (h.includes('izmocars.com') || h.includes('goizmo.com'))
    return 'izmocars'
  if (h.includes('v12software.com'))
    return 'v12_software'
  if (h.includes('promaxunlimited.com') || h.includes('promaxauto.com'))
    return 'promax'
  if (h.includes('ebizautos.com'))
    return 'ebizautos'
  if (h.includes('dealeralchemist.com') || h.includes('dealervenom.com'))
    return 'dealer_alchemist'
  if (h.includes('nabthat.com'))
    return 'nabthat'
  if (h.includes('tkcarsites.com'))
    return 'tk_carsites'
  if (h.includes('motivehq.com'))
    return 'motive'
  // Tier 4: Niche platforms
  if (h.includes('foxdealer.com') || h.includes('foxdealer'))
    return 'fox_dealer'
  if (h.includes('savvydealer.com') || h.includes('savvy-dealer'))
    return 'savvy_dealer'
  if (h.includes('sincrodigital.com') || h.includes('sincro.'))
    return 'sincro'
  if (h.includes('dealereprocess.com') || h.includes('eprocess'))
    return 'dealer_eprocess'
  if (h.includes('fusionzone.com') || h.includes('fzautomotive'))
    return 'fusionzone'
  if (h.includes('autojini.com'))
    return 'autojini'
  if (h.includes('dealercenter.com') || h.includes('dealercenter.net'))
    return 'dealercenter'
  if (h.includes('speeddigital.com'))
    return 'speed_digital'
  if (h.includes('getmyauto.com'))
    return 'get_my_auto'
  if (h.includes('flexdealer.com'))
    return 'flexdealer'
  if (h.includes('dealerwebsites.com'))
    return 'dealerwebsites'
  if (h.includes('spyne.ai'))
    return 'spyne'
  if (h.includes('dealerspike.com') || h.includes('dealerspike.net'))
    return 'dealer_spike'
  if (h.includes('dealerteamwork.com') || h.includes('mpop'))
    return 'dealer_teamwork'
  return null
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

function getDealerBasics(url: string, html: string, jsonLdData: any[]): Record<string, any> {
  const info: Record<string, any> = {
    url,
    domain: new URL(url).hostname,
    title: '',
    dealer_name: '',
    phone: '',
    address: '',
    brands: [],
    meta_description: '',
  }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    info.title = titleMatch[1].trim()
    for (const sep of ['|', ' - ', ':']) {
      if (info.title.includes(sep)) {
        info.dealer_name = info.title.split(sep)[0].trim()
        break
      }
    }
    if (!info.dealer_name) info.dealer_name = info.title
  }

  // Meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  if (metaMatch) info.meta_description = metaMatch[1]

  // Phone from tel: links
  const telMatch = html.match(/href=["']tel:([^"']+)["']/i)
  if (telMatch) info.phone = telMatch[1].replace(/[^\d+\-.()\s]/g, '').trim()

  // JSON-LD structured data
  for (const item of jsonLdData) {
    if (item['@type'] === 'AutoDealer' || item['@type'] === 'LocalBusiness') {
      if (item.name) info.dealer_name = item.name
      if (item.telephone) info.phone = item.telephone
      if (item.address) {
        const a = item.address
        const parts = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean)
        info.address = parts.join(', ')
      }
    }
  }

  // OEM brands from title
  const titleLower = (info.title + ' ' + info.dealer_name).toLowerCase()
  for (const brand of OEM_BRANDS) {
    if (titleLower.includes(brand.toLowerCase()) && !info.brands.includes(brand)) {
      info.brands.push(brand)
    }
  }

  return info
}

function detectTechStack(html: string): Record<string, any> {
  const detected: Record<string, string[]> = {
    website_platform: [], dms_crm: [], chat_messaging: [], digital_retailing: [],
    marketing_retargeting: [], inventory_tools: [], trade_in_tools: [], scheduling: [],
    all_detected: [],
  }

  const htmlLower = html.toLowerCase()

  for (const [techName, fingerprints] of Object.entries(TECH_FINGERPRINTS)) {
    for (const fp of fingerprints) {
      if (htmlLower.includes(fp.toLowerCase())) {
        const cat = CATEGORY_MAP[techName] || 'marketing_retargeting'
        if (!detected[cat].includes(techName)) detected[cat].push(techName)
        if (!detected.all_detected.includes(techName)) detected.all_detected.push(techName)
        break
      }
    }
  }

  return detected
}

function analyzeSeo(url: string, html: string): Record<string, any> {
  const seo: Record<string, any> = {
    score: 0, grade: 'F', checks: [],
    title_tag: '', meta_description: '',
    has_ssl: url.startsWith('https'),
  }
  let points = 0
  const maxPoints = 90 // we can't check sitemap/robots from edge function easily, skip those

  // SSL
  if (seo.has_ssl) { points += 10; seo.checks.push(['HTTPS/SSL', true, 'Site uses HTTPS']) }
  else seo.checks.push(['HTTPS/SSL', false, 'Site not using HTTPS — critical security issue'])

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const titleLen = titleMatch ? titleMatch[1].trim().length : 0
  seo.title_tag = titleMatch ? titleMatch[1].trim() : ''
  if (titleLen >= 30 && titleLen <= 60) { points += 10; seo.checks.push(['Title Tag', true, `Good length (${titleLen} chars)`]) }
  else if (titleLen > 0) { points += 5; seo.checks.push(['Title Tag', 'partial', `Present but suboptimal (${titleLen} chars)`]) }
  else seo.checks.push(['Title Tag', false, 'Missing title tag'])

  // Meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  const descLen = metaMatch ? metaMatch[1].length : 0
  if (descLen >= 120 && descLen <= 160) { points += 10; seo.checks.push(['Meta Description', true, `Good length (${descLen} chars)`]) }
  else if (descLen > 0) { points += 5; seo.checks.push(['Meta Description', 'partial', `Present but suboptimal (${descLen} chars)`]) }
  else seo.checks.push(['Meta Description', false, 'Missing meta description'])

  // H1
  const h1Matches = html.match(/<h1[^>]*>/gi) || []
  if (h1Matches.length === 1) { points += 10; seo.checks.push(['H1 Tag', true, 'Single H1 found']) }
  else if (h1Matches.length > 1) { points += 5; seo.checks.push(['H1 Tag', 'partial', `Multiple H1 tags (${h1Matches.length})`]) }
  else seo.checks.push(['H1 Tag', false, 'No H1 tag found'])

  // Viewport
  if (html.includes('name="viewport"') || html.includes("name='viewport'")) {
    points += 10; seo.checks.push(['Mobile Viewport', true, 'Viewport meta tag present'])
  } else seo.checks.push(['Mobile Viewport', false, 'Missing viewport meta tag'])

  // Schema
  const schemaCount = (html.match(/application\/ld\+json/gi) || []).length
  if (schemaCount > 0) { points += 10; seo.checks.push(['Schema Markup', true, `${schemaCount} structured data blocks found`]) }
  else seo.checks.push(['Schema Markup', false, 'No JSON-LD schema markup found'])

  // Image alt tags
  const imgTags = html.match(/<img[^>]+>/gi) || []
  const withAlt = imgTags.filter(t => /alt=["'][^"']+["']/.test(t)).length
  const altRatio = imgTags.length ? withAlt / imgTags.length : 1
  if (altRatio >= 0.8) { points += 10; seo.checks.push(['Image Alt Tags', true, `${withAlt}/${imgTags.length} images have alt text`]) }
  else if (altRatio >= 0.5) { points += 5; seo.checks.push(['Image Alt Tags', 'partial', `Only ${withAlt}/${imgTags.length} images have alt text`]) }
  else seo.checks.push(['Image Alt Tags', false, `Only ${withAlt}/${imgTags.length} images have alt text`])

  // Word count (rough)
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = text.split(' ').filter(w => w.length > 2).length
  if (wordCount >= 500) { points += 10; seo.checks.push(['Content Depth', true, `~${wordCount} words on homepage`]) }
  else if (wordCount >= 200) { points += 5; seo.checks.push(['Content Depth', 'partial', `Light content (~${wordCount} words)`]) }
  else seo.checks.push(['Content Depth', false, `Very thin content (~${wordCount} words) — likely JS-rendered`])

  // GA4 check
  const hasGA4 = html.includes('gtag/js') || html.includes('google-analytics.com/g/')
  if (!hasGA4) seo.checks.push(['GA4 Analytics', false, 'Google Analytics 4 not detected'])
  else { points += 10; seo.checks.push(['GA4 Analytics', true, 'Google Analytics 4 detected']) }

  seo.score = Math.round((points / (maxPoints + 10)) * 100)
  if (seo.score >= 90) seo.grade = 'A'
  else if (seo.score >= 80) seo.grade = 'B+'
  else if (seo.score >= 70) seo.grade = 'B'
  else if (seo.score >= 60) seo.grade = 'C+'
  else if (seo.score >= 50) seo.grade = 'C'
  else if (seo.score >= 40) seo.grade = 'D'
  else seo.grade = 'F'

  return seo
}

function identifyOpportunities(tech: Record<string, any>, seo: Record<string, any>, inventory: Record<string, any>): any[] {
  const opps: any[] = []

  if (!tech.digital_retailing?.length) opps.push({
    category: 'Digital Retailing',
    priority: 'HIGH',
    detail: 'No online buying/payment tools detected (Roadster, AutoFi, MakeMyDeal).',
    pitch_angle: "Consumers expect to start the deal online. This dealer is losing leads to competitors with digital retailing.",
  })

  if (!tech.trade_in_tools?.length) opps.push({
    category: 'Trade-In Tools',
    priority: 'HIGH',
    detail: 'No trade-in valuation tool detected (KBB ICO, TradePending, etc.).',
    pitch_angle: "Trade-in tools capture leads at the top of the funnel. This is also a natural ValueShield tie-in.",
  })

  if (!tech.chat_messaging?.length) opps.push({
    category: 'Chat / Messaging',
    priority: 'MEDIUM',
    detail: 'No chat widget detected on the website.',
    pitch_angle: "Live chat captures after-hours leads. Shoppers browsing at 9pm won't fill out a contact form.",
  })

  if ((seo.score || 0) < 60) opps.push({
    category: 'SEO Services',
    priority: 'HIGH',
    detail: `SEO score is ${seo.score}/100 (Grade: ${seo.grade}). Multiple on-page issues found.`,
    pitch_angle: "Poor SEO = invisible to local shoppers. Simple fixes could dramatically improve organic traffic.",
  })

  if (!tech.scheduling?.length) opps.push({
    category: 'Service Scheduling',
    priority: 'MEDIUM',
    detail: 'No online service scheduling tool detected.',
    pitch_angle: "Online scheduling reduces phone calls and increases service lane throughput.",
  })

  const marketing = tech.marketing_retargeting || []
  if (!marketing.includes('Google Analytics 4') && marketing.includes('Google Analytics (UA)')) opps.push({
    category: 'Analytics Upgrade',
    priority: 'LOW',
    detail: 'Still running Universal Analytics (deprecated July 2023).',
    pitch_angle: "They may be flying blind on website analytics. GA4 migration is an easy conversation starter.",
  })

  const total = inventory.total_count || 0
  if (total > 0 && total < 50) opps.push({
    category: 'Inventory Visibility',
    priority: 'MEDIUM',
    detail: `Only ${total} vehicles detected online. Low online inventory visibility.`,
    pitch_angle: "Thin online inventory hurts both SEO and lead generation. Merchandising tools can help.",
  })

  if (tech.website_platform?.some((p: string) => p.toLowerCase().includes('cdk') || p.toLowerCase().includes('dealer.com'))) opps.push({
    category: 'CDK Contract Timing',
    priority: 'MEDIUM',
    detail: 'CDK/Dealer.com stack detected. CDK contracts typically run 3–5 years.',
    pitch_angle: "If renewal is coming up, this is prime time to pitch alternative DMS or CRM solutions.",
  })

  return opps
}

// ============================================================
// PLATFORM-SPECIFIC INVENTORY FETCHERS
// ============================================================

function buildEmptyInventory(): Record<string, any> {
  return {
    new_count: 0, used_count: 0, certified_count: 0, total_count: 0,
    avg_new_price: 0, avg_used_price: 0,
    makes: {}, models: {}, years: {}, price_ranges: {},
    sample_vehicles: [],
  }
}

function addVehicleToInventory(inventory: Record<string, any>, vehicle: Record<string, any>) {
  if (!vehicle.make) return
  const existing = inventory.sample_vehicles.find((sv: any) => sv.vin && sv.vin === vehicle.vin)
  if (existing) return
  inventory.sample_vehicles.push(vehicle)
  inventory.makes[vehicle.make] = (inventory.makes[vehicle.make] || 0) + 1
  const modelKey = `${vehicle.make} ${vehicle.model}`.trim()
  if (modelKey) inventory.models[modelKey] = (inventory.models[modelKey] || 0) + 1
  if (vehicle.year) inventory.years[String(vehicle.year)] = (inventory.years[String(vehicle.year)] || 0) + 1
  if (vehicle.price) {
    const p = vehicle.price
    const key = p < 20000 ? 'under_20k' : p < 30000 ? '20k_30k' : p < 40000 ? '30k_40k' : p < 50000 ? '40k_50k' : '50k_plus'
    inventory.price_ranges[key] = (inventory.price_ranges[key] || 0) + 1
  }
}

function calcInventoryAverages(inventory: Record<string, any>) {
  const newPrices = inventory.sample_vehicles.filter((v: any) => v.condition === 'new' && v.price).map((v: any) => v.price)
  const usedPrices = inventory.sample_vehicles.filter((v: any) => v.condition === 'used' && v.price).map((v: any) => v.price)
  if (newPrices.length) inventory.avg_new_price = Math.round(newPrices.reduce((a: number, b: number) => a + b, 0) / newPrices.length)
  if (usedPrices.length) inventory.avg_used_price = Math.round(usedPrices.reduce((a: number, b: number) => a + b, 0) / usedPrices.length)
}

/** Dealer.com (DDC) — uses their widget API for full JSON inventory data */
async function fetchDDCInventory(baseUrl: string): Promise<Record<string, any> | null> {
  const inventory = buildEmptyInventory()
  try {
    async function fetchDDCCondition(condition: 'NEW' | 'USED' | 'CERTIFIED'): Promise<{ count: number; vehicles: any[] }> {
      try {
        const resp = await fetch(
          `${baseUrl}/apis/widget/INVENTORY_LISTING_DEFAULT_AUTO_${condition}:inventory-data-bus1/getInventory`,
          { headers: buildBrowserHeaders(baseUrl), signal: AbortSignal.timeout(8000) }
        )
        if (!resp.ok) return { count: 0, vehicles: [] }
        const data = await resp.json()
        return {
          count: data.pageInfo?.totalCount || 0,
          vehicles: data.pageInfo?.trackingData || [],
        }
      } catch { return { count: 0, vehicles: [] } }
    }

    const [newData, usedData, certData] = await Promise.all([
      fetchDDCCondition('NEW'),
      fetchDDCCondition('USED'),
      fetchDDCCondition('CERTIFIED'),
    ])

    inventory.new_count = newData.count
    inventory.used_count = usedData.count
    inventory.certified_count = certData.count

    // Extract vehicle details from tracking data (sample up to 50 per condition)
    for (const { vehicles, condition } of [
      { vehicles: newData.vehicles, condition: 'new' },
      { vehicles: usedData.vehicles, condition: 'used' },
    ]) {
      for (const v of vehicles.slice(0, 50)) {
        addVehicleToInventory(inventory, {
          year: v.modelYear || '',
          make: v.make || '',
          model: v.model || '',
          vin: v.vin || '',
          price: parsePrice(v.pricing?.retailPrice || v.pricing?.msrp || v.pricing?.dealerPrice || 0),
          condition,
        })
      }
    }

    inventory.total_count = inventory.new_count + inventory.used_count + inventory.certified_count
    calcInventoryAverages(inventory)
    if (inventory.total_count > 0) return inventory
    return null
  } catch { return null }
}

/** DealerOn — fetches searchnew.aspx / searchused.aspx and parses embedded tagging data + JSON-LD */
async function fetchDealerOnInventory(baseUrl: string): Promise<{ inventory: Record<string, any>; srpHtml: string } | null> {
  const inventory = buildEmptyInventory()
  const htmlChunks: string[] = []

  async function fetchDealerOnPage(path: string): Promise<{ count: number; jsonLd: any[]; html: string }> {
    try {
      const resp = await fetch(`${baseUrl}/${path}`, {
        headers: buildBrowserHeaders(baseUrl),
        signal: AbortSignal.timeout(10000),
      })
      if (!resp.ok) return { count: 0, jsonLd: [], html: '' }
      const html = await resp.text()

      // Try dealeron_tagging_data first (by id attribute)
      let count = 0
      const tagMatch = html.match(/<script[^>]+id=["']dealeron_tagging_data["'][^>]*>([\s\S]*?)<\/script>/i)
      if (tagMatch) {
        try {
          const tagData = JSON.parse(tagMatch[1])
          count = tagData.itemCount || tagData.items?.length || 0
        } catch { /* ignore */ }
      }
      // Fallback: find inline JSON with itemCount (some DealerOn sites embed without the id)
      if (!count) {
        const inlineMatch = html.match(/<script[^>]*>\s*(\{"dealerId"[^<]*"itemCount"\s*:\s*\d+[^<]*\})\s*<\/script>/i)
          || html.match(/<script[^>]*>\s*(\{[^<]*"pageType"\s*:\s*"itemlist"[^<]*"itemCount"\s*:\s*\d+[^<]*\})\s*<\/script>/i)
        if (inlineMatch) {
          try {
            const tagData = JSON.parse(inlineMatch[1])
            count = tagData.itemCount || tagData.items?.length || 0
          } catch { /* ignore */ }
        }
      }
      // Fallback: parse count from HTML text
      if (!count) {
        const countMatch = html.match(/(\d+)\s*(?:vehicles?|results?|cars?)\s*(?:found|available|in stock|matching)/i)
        if (countMatch) count = parseInt(countMatch[1]) || 0
      }
      return { count, jsonLd: extractJsonLd(html), html }
    } catch { return { count: 0, jsonLd: [], html: '' } }
  }

  try {
    const [newResult, usedResult] = await Promise.all([
      fetchDealerOnPage('searchnew.aspx'),
      fetchDealerOnPage('searchused.aspx'),
    ])

    if (newResult.html) htmlChunks.push(newResult.html)
    if (usedResult.html) htmlChunks.push(usedResult.html)

    inventory.new_count = newResult.count
    inventory.used_count = usedResult.count

    // Extract vehicle details from JSON-LD on those pages
    for (const { jsonLd, condition } of [
      { jsonLd: newResult.jsonLd, condition: 'new' as const },
      { jsonLd: usedResult.jsonLd, condition: 'used' as const },
    ]) {
      for (const item of jsonLd) {
        const items: any[] = item['@type'] === 'ItemList'
          ? (item.itemListElement || []).map((e: any) => e.item || e)
          : [item]
        for (const v of items) {
          if (!['Car', 'Vehicle', 'Product'].includes(v['@type'])) continue
          addVehicleToInventory(inventory, {
            year: v.modelDate || v.vehicleModelDate || '',
            make: typeof v.brand === 'object' ? v.brand?.name : (v.brand || v.manufacturer || ''),
            model: v.model || v.name || '',
            vin: v.vehicleIdentificationNumber || '',
            price: parsePrice(Array.isArray(v.offers) ? v.offers[0]?.price : v.offers?.price || 0),
            condition,
          })
        }
      }
    }

    inventory.total_count = inventory.new_count + inventory.used_count
    calcInventoryAverages(inventory)
    if (inventory.total_count > 0) return { inventory, srpHtml: htmlChunks.join('\n') }
    return null
  } catch { return null }
}

/** Generic SRP-based fetcher — works for Dealer Inspire, DealerSocket, and other platforms
 *  that serve partial HTML on their /new-inventory/ or /new-vehicles/ pages */
async function fetchGenericSRPInventory(baseUrl: string, platform: string | null): Promise<{ inventory: Record<string, any>; srpHtml: string } | null> {
  const inventory = buildEmptyInventory()
  const htmlChunks: string[] = []

  // Platform-specific SRP paths (known URL patterns per provider)
  const srpPaths: Record<string, { newPaths: string[]; usedPaths: string[] }> = {
    dealer_inspire: {
      newPaths: ['/inventory/new/', '/new-vehicles/'],
      usedPaths: ['/inventory/used/', '/used-vehicles/'],
    },
    dealersocket: {
      newPaths: ['/new-inventory/index.htm', '/new-inventory/'],
      usedPaths: ['/used-inventory/index.htm', '/used-inventory/'],
    },
    dealer_fire: {
      newPaths: ['/new-vehicles/', '/new-inventory/'],
      usedPaths: ['/used-vehicles/', '/used-inventory/'],
    },
    fox_dealer: {
      newPaths: ['/new-vehicles/', '/inventory/new/'],
      usedPaths: ['/pre-owned-vehicles/', '/inventory/used/'],
    },
    overfuel: {
      newPaths: ['/inventory/new/', '/inventory/?condition=New'],
      usedPaths: ['/inventory/used/', '/inventory/?condition=Used'],
    },
    jazel: {
      newPaths: ['/inventory/', '/new-inventory/'],
      usedPaths: ['/used-inventory/', '/pre-owned/'],
    },
    dealersync: {
      newPaths: ['/new-inventory/', '/inventory/new/'],
      usedPaths: ['/used-inventory/', '/inventory/used/'],
    },
    autorevo: {
      newPaths: ['/inventory/', '/new-inventory/'],
      usedPaths: ['/used-inventory/'],
    },
    naked_lime: {
      newPaths: ['/new/', '/new-inventory/'],
      usedPaths: ['/used/', '/used-inventory/'],
    },
    autofusion: {
      newPaths: ['/new-inventory/', '/inventory/new/'],
      usedPaths: ['/used-inventory/', '/inventory/used/'],
    },
    dealer_alchemist: {
      newPaths: ['/new-inventory/', '/new-vehicles/'],
      usedPaths: ['/used-inventory/', '/used-vehicles/'],
    },
    dealer_spike: {
      newPaths: ['/new-inventory/', '/inventory/'],
      usedPaths: ['/used-inventory/', '/pre-owned/'],
    },
    _default: {
      newPaths: ['/new-inventory/', '/new-vehicles/', '/inventory/new/'],
      usedPaths: ['/used-inventory/', '/used-vehicles/', '/inventory/used/', '/pre-owned/'],
    },
  }

  const paths = srpPaths[platform || ''] || srpPaths._default

  async function fetchSRPPage(pagePaths: string[], condition: 'new' | 'used'): Promise<{ count: number; jsonLd: any[]; html: string }> {
    for (const path of pagePaths) {
      try {
        const resp = await fetch(`${baseUrl}${path}`, {
          headers: buildBrowserHeaders(baseUrl),
          signal: AbortSignal.timeout(8000),
        })
        if (!resp.ok) continue
        const html = await resp.text()

        // Parse count from multiple common patterns
        let count = 0
        const patterns = [
          /(\d+)\s*(?:vehicles?|results?|cars?)\s*(?:found|available|in stock|matching)/i,
          /showing\s*\d+\s*(?:[-–]|to)\s*\d+\s*of\s*(\d+)/i,
          /(?:total|found|showing)\s*:\s*(\d+)/i,
          /"totalResults"\s*:\s*(\d+)/i,
          /"total(?:Count|Results|Vehicles)"\s*:\s*(\d+)/i,
          /"itemCount"\s*:\s*(\d+)/i,
        ]
        for (const pat of patterns) {
          const m = html.match(pat)
          if (m) {
            const c = parseInt(m[1])
            if (c > 0 && c < 10000) { count = c; break }
          }
        }

        const jsonLd = extractJsonLd(html)
        if (count > 0 || jsonLd.length > 0) return { count, jsonLd, html }
      } catch { continue }
    }
    return { count: 0, jsonLd: [], html: '' }
  }

  try {
    const [newResult, usedResult] = await Promise.all([
      fetchSRPPage(paths.newPaths, 'new'),
      fetchSRPPage(paths.usedPaths, 'used'),
    ])

    if (newResult.html) htmlChunks.push(newResult.html)
    if (usedResult.html) htmlChunks.push(usedResult.html)

    inventory.new_count = newResult.count
    inventory.used_count = usedResult.count

    // Extract vehicle details from JSON-LD
    for (const { jsonLd, condition } of [
      { jsonLd: newResult.jsonLd, condition: 'new' as const },
      { jsonLd: usedResult.jsonLd, condition: 'used' as const },
    ]) {
      for (const item of jsonLd) {
        const items: any[] = item['@type'] === 'ItemList'
          ? (item.itemListElement || []).map((e: any) => e.item || e)
          : [item]
        for (const v of items) {
          if (!['Car', 'Vehicle', 'Product'].includes(v['@type'])) continue
          addVehicleToInventory(inventory, {
            year: v.modelDate || v.vehicleModelDate || '',
            make: typeof v.brand === 'object' ? v.brand?.name : (v.brand || v.manufacturer || ''),
            model: v.model || v.name || '',
            vin: v.vehicleIdentificationNumber || '',
            price: parsePrice(Array.isArray(v.offers) ? v.offers[0]?.price : v.offers?.price || 0),
            condition,
          })
        }
      }
    }

    inventory.total_count = inventory.new_count + inventory.used_count
    calcInventoryAverages(inventory)
    if (inventory.total_count > 0 || inventory.sample_vehicles.length > 0) return { inventory, srpHtml: htmlChunks.join('\n') }
    return null
  } catch { return null }
}

// ============================================================
// INVENTORY SCRAPER (with platform-aware API-first approach)
// ============================================================

async function scrapeInventory(baseUrl: string, html: string, jsonLdData: any[], platform: string | null): Promise<{ inventory: Record<string, any>; srpHtml: string }> {
  // ---- Try platform-specific API first ----
  if (platform === 'dealer_com') {
    console.log('[inventory] Trying DDC widget API...')
    const apiResult = await fetchDDCInventory(baseUrl)
    if (apiResult && apiResult.total_count > 0) {
      console.log(`[inventory] DDC API returned ${apiResult.total_count} vehicles`)
      return { inventory: apiResult, srpHtml: '' }  // DDC uses JSON API, no HTML
    }
  }
  if (platform === 'dealeron') {
    console.log('[inventory] Trying DealerOn SRP pages...')
    const result = await fetchDealerOnInventory(baseUrl)
    if (result && result.inventory.total_count > 0) {
      console.log(`[inventory] DealerOn returned ${result.inventory.total_count} vehicles`)
      return result
    }
  }
  // Tier 2 platforms: try generic SRP fetcher with platform-specific paths
  if (platform && !['dealer_com', 'dealeron'].includes(platform)) {
    console.log(`[inventory] Trying generic SRP for platform: ${platform}`)
    const result = await fetchGenericSRPInventory(baseUrl, platform)
    if (result && result.inventory.total_count > 0) {
      console.log(`[inventory] SRP returned ${result.inventory.total_count} vehicles for ${platform}`)
      return result
    }
  }

  console.log('[inventory] Falling back to HTML/JSON-LD parsing...')

  // ---- Fallback: existing HTML / JSON-LD parsing ----
  const inventory: Record<string, any> = {
    new_count: 0, used_count: 0, certified_count: 0, total_count: 0,
    avg_new_price: 0, avg_used_price: 0,
    makes: {}, models: {}, years: {}, price_ranges: {},
    sample_vehicles: [],
  }

  // Extract vehicles from JSON-LD
  for (const item of jsonLdData) {
    const items: any[] = item['@type'] === 'ItemList'
      ? (item.itemListElement || []).map((e: any) => e.item || e)
      : [item]

    for (const v of items) {
      if (!['Car', 'Vehicle', 'Product'].includes(v['@type'])) continue

      const vehicle: Record<string, any> = {}
      vehicle.year = v.modelDate || v.vehicleModelDate || ''
      vehicle.make = typeof v.brand === 'object' ? v.brand?.name : (v.brand || v.manufacturer || '')
      vehicle.model = v.model || v.name || ''
      vehicle.vin = v.vehicleIdentificationNumber || ''

      const offerPrice = Array.isArray(v.offers) ? v.offers[0]?.price : v.offers?.price
      vehicle.price = parsePrice(offerPrice || 0)

      const cond = String(v.itemCondition || '')
      vehicle.condition = cond.includes('New') ? 'new' : cond.includes('Used') ? 'used' : 'unknown'

      if (vehicle.make || vehicle.model) {
        const existing = inventory.sample_vehicles.find((sv: any) => sv.vin && sv.vin === vehicle.vin)
        if (!existing) {
          inventory.sample_vehicles.push(vehicle)
          if (vehicle.make) inventory.makes[vehicle.make] = (inventory.makes[vehicle.make] || 0) + 1
          const modelKey = `${vehicle.make} ${vehicle.model}`.trim()
          if (modelKey) inventory.models[modelKey] = (inventory.models[modelKey] || 0) + 1
          if (vehicle.year) inventory.years[vehicle.year] = (inventory.years[vehicle.year] || 0) + 1

          const p = vehicle.price
          if (p) {
            const key = p < 20000 ? 'under_20k' : p < 30000 ? '20k_30k' : p < 40000 ? '30k_40k' : p < 50000 ? '40k_50k' : '50k_plus'
            inventory.price_ranges[key] = (inventory.price_ranges[key] || 0) + 1
          }

          if (vehicle.condition === 'new') inventory.new_count++
          else if (vehicle.condition === 'used') inventory.used_count++
        }
      }
    }
  }

  // Try to parse count from HTML text
  const countMatch = html.match(/(\d+)\s*(?:vehicles?|results?|cars?)\s*(?:found|available|in stock)?/i)
  if (countMatch) {
    const c = parseInt(countMatch[1])
    if (c > 5 && c < 5000) {
      if (!inventory.new_count && !inventory.used_count) {
        inventory.total_count = c
      }
    }
  }

  // Look for inventory links and try to scrape one
  const invLinkMatch = html.match(/href=["']([^"']*(?:new-inventory|used-inventory|new-vehicles|used-vehicles|inventory)[^"']*)["']/gi)
  if (invLinkMatch && invLinkMatch.length > 0) {
    for (const linkHtml of invLinkMatch.slice(0, 3)) {
      try {
        const hrefMatch = linkHtml.match(/href=["']([^"']+)["']/)
        if (!hrefMatch) continue
        const invUrl = new URL(hrefMatch[1], baseUrl).href
        const invResp = await fetch(invUrl, {
          headers: buildBrowserHeaders(invUrl),
          signal: AbortSignal.timeout(8000),
        })
        if (!invResp.ok) continue
        const invHtml = await invResp.text()

        // Parse count
        const countM = invHtml.match(/(\d+)\s*(?:vehicles?|results?|cars?)/i)
        if (countM) {
          const c = parseInt(countM[1])
          if (c > 5 && c < 5000) {
            const isNew = invUrl.toLowerCase().includes('new')
            const isUsed = invUrl.toLowerCase().includes('used')
            if (isNew) inventory.new_count = Math.max(inventory.new_count, c)
            else if (isUsed) inventory.used_count = Math.max(inventory.used_count, c)
            else if (!inventory.total_count) inventory.total_count = c
          }
        }

        // Parse JSON-LD from inventory page
        const invJsonLd = extractJsonLd(invHtml)
        for (const item of invJsonLd) {
          if (['Car', 'Vehicle'].includes(item['@type'])) {
            const vehicle: Record<string, any> = {
              make: typeof item.brand === 'object' ? item.brand?.name : (item.brand || ''),
              model: item.model || '',
              year: item.modelDate || '',
              price: parsePrice(item.offers?.price || 0),
              condition: String(item.itemCondition || '').includes('New') ? 'new' : 'used',
              vin: item.vehicleIdentificationNumber || '',
            }
            if (vehicle.make) {
              inventory.sample_vehicles.push(vehicle)
              inventory.makes[vehicle.make] = (inventory.makes[vehicle.make] || 0) + 1
              if (vehicle.condition === 'new') inventory.new_count++
              else inventory.used_count++
            }
          }
        }
        break
      } catch { /* continue */ }
    }
  }

  inventory.total_count = inventory.total_count || inventory.new_count + inventory.used_count + inventory.certified_count || inventory.sample_vehicles.length

  // If fallback HTML parsing also found nothing and platform is unknown, try generic SRP as last resort
  if (inventory.total_count === 0 && !platform) {
    console.log('[inventory] No data from HTML fallback, trying generic SRP paths...')
    const result = await fetchGenericSRPInventory(baseUrl, null)
    if (result && result.inventory.total_count > 0) {
      console.log(`[inventory] Generic SRP last-resort found ${result.inventory.total_count} vehicles`)
      return result
    }
  }

  // ---- Typesense API (Dealer Venom / Dealer Alchemist sites with JS-rendered inventory) ----
  if (inventory.total_count === 0) {
    const tsConfig = extractTypesenseConfig(html)
    if (tsConfig) {
      console.log(`[inventory] Found Typesense config, querying API...`)
      const tsResult = await fetchTypesenseInventory(tsConfig)
      if (tsResult && tsResult.inventory.total_count > 0) {
        console.log(`[inventory] Typesense returned ${tsResult.inventory.total_count} vehicles`)
        return tsResult
      }
    }
  }

  // ---- Homepage static count fallback (universal last-resort) ----
  if (inventory.total_count === 0) {
    const hpCounts = parseHomepageInventoryCounts(html)
    if (hpCounts.new_count > 0 || hpCounts.used_count > 0) {
      console.log(`[inventory] Homepage count fallback: ${hpCounts.new_count} new, ${hpCounts.used_count} used`)
      inventory.new_count = hpCounts.new_count
      inventory.used_count = hpCounts.used_count
      inventory.total_count = hpCounts.new_count + hpCounts.used_count
    }
  }

  const newPrices = inventory.sample_vehicles.filter((v: any) => v.condition === 'new' && v.price).map((v: any) => v.price)
  const usedPrices = inventory.sample_vehicles.filter((v: any) => v.condition === 'used' && v.price).map((v: any) => v.price)
  if (newPrices.length) inventory.avg_new_price = Math.round(newPrices.reduce((a: number, b: number) => a + b, 0) / newPrices.length)
  if (usedPrices.length) inventory.avg_used_price = Math.round(usedPrices.reduce((a: number, b: number) => a + b, 0) / usedPrices.length)

  return { inventory, srpHtml: '' }
}

// ============================================================
// MAIN HANDLER
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  /** Helper to update progress stage in the DB */
  async function updateProgress(reportId: string, stage: string) {
    await supabaseClient.from('reports').update({ progress_stage: stage }).eq('id', reportId)
  }

  try {
    const { reportId, url } = await req.json()

    if (!reportId || !url) {
      return new Response(JSON.stringify({ error: 'Missing reportId or url' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update status to running
    await supabaseClient.from('reports').update({ status: 'running' }).eq('id', reportId)

    // ── Stage 0: Fetch homepage ──
    await updateProgress(reportId, 'fetching_homepage')
    console.log(`[scrape] Stage 0: Fetching homepage for ${url}`)

    const resp = await fetch(url, {
      headers: buildBrowserHeaders(url),
      signal: AbortSignal.timeout(12000),
    })

    const htmlRaw = await resp.text()

    // Check for Cloudflare block (even on non-ok responses, try to extract info)
    const cfBlock = detectCloudflareBlock(htmlRaw, resp.status)
    if (cfBlock) {
      console.log(`[scrape] Cloudflare block detected: ${cfBlock}`)
    }
    if (!resp.ok && !cfBlock) throw new Error(`Failed to fetch ${url}: ${resp.status}`)

    // If CF blocked, html will be the challenge page — still try to extract what we can
    const html = htmlRaw
    const jsonLdData = extractJsonLd(html)
    const platform = detectPlatform(html, url)
    console.log(`[scrape] Platform detected: ${platform || 'unknown'} for ${url}`)

    // ── Stage 1: Discover subpage links (synchronous) ──
    const subpageUrls = discoverSubpageUrls(url, html)
    console.log(`[scrape] Stage 1: Discovered ${subpageUrls.length} subpage URLs`)

    // ── Stage 2: Parallel crawl subpages + inventory ──
    await updateProgress(reportId, 'crawling_subpages')
    console.log(`[scrape] Stage 2: Crawling subpages + inventory in parallel`)

    const [subpageHtml, inventoryResult] = await Promise.all([
      fetchSubpages(subpageUrls),
      scrapeInventory(url, html, jsonLdData, platform),
    ])

    // ── Stage 3: Analysis on ALL html combined ──
    await updateProgress(reportId, 'analyzing')
    console.log(`[scrape] Stage 3: Analyzing combined HTML (homepage + ${subpageUrls.length} subpages + SRP)`)

    const combinedHtml = html + '\n' + subpageHtml + '\n' + inventoryResult.srpHtml
    const dealer_info = getDealerBasics(url, html, jsonLdData)
    const tech_stack = detectTechStack(combinedHtml)
    const seo = analyzeSeo(url, html)  // SEO still homepage-only (correct)
    const inventory = inventoryResult.inventory
    const opportunities = identifyOpportunities(tech_stack, seo, inventory)

    const reportData: Record<string, any> = { dealer_info, inventory, tech_stack, seo, opportunities, platform: platform || 'unknown' }
    if (cfBlock) {
      reportData.cloudflare_blocked = cfBlock
    }

    // ── Stage 4: Save completed report ──
    await supabaseClient
      .from('reports')
      .update({
        status: 'complete',
        progress_stage: 'complete',
        dealer_name: dealer_info.dealer_name || url,
        data: reportData,
      })
      .eq('id', reportId)

    // Increment usage counter
    const { data: authData } = await supabaseClient.auth.admin.getUserById(
      (await supabaseClient.from('reports').select('user_id').eq('id', reportId).single()).data?.user_id
    )
    if (authData?.user) {
      await supabaseClient
        .from('profiles')
        .update({ reports_this_month: supabaseClient.rpc('increment', { row_id: authData.user.id }) })
        .eq('id', authData.user.id)
    }

    console.log(`[scrape] Done! Report ${reportId} complete.`)
    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Scrape error:', err)

    // Try to mark report as error if we have reportId
    try {
      const body = await req.clone().json().catch(() => ({}))
      if (body.reportId) {
        await supabaseClient
          .from('reports')
          .update({ status: 'error', error_message: String(err) })
          .eq('id', body.reportId)
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
